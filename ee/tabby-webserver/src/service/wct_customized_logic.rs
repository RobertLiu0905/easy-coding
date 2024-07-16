use reqwest::Client;
use std::sync::{Arc, Mutex};
use std::num::NonZeroUsize;
use std::time::Duration;
use std::error::Error as StdError;
use std::io;
use lru::LruCache;
use lazy_static::lazy_static;
use serde_json::Value;

use aes_gcm::aead::{Aead, KeyInit, OsRng};
use aes_gcm::{Aes128Gcm, Key, Nonce};

// 共享的缓存
lazy_static! {
    static ref CACHE_SUCCESS: Arc<Mutex<LruCache<String, ()>>> = Arc::new(Mutex::new(LruCache::<String, ()>::new(NonZeroUsize::new(10240).unwrap())));
    static ref CACHE_FAILURE: Arc<Mutex<LruCache<String, ()>>> = Arc::new(Mutex::new(LruCache::<String, ()>::new(NonZeroUsize::new(1024).unwrap())));
    static ref CLIENT: Client = Client::builder()
        .timeout(Duration::from_secs(10)) // 设置超时时间为10秒
        .pool_max_idle_per_host(10) // 设置连接池中每个主机的最大空闲连接数
        .build()
        .expect("Failed to create reqwest client");
}

const KEY: &[u8] = b"ailabcreatetoken"; // 16 bytes
const SALT: &str = "lab.iwhalecloud.com"; // 固定的盐值

pub struct VerifyTokenResult {
    pub user_id: i64,
    pub user_code: String,
    pub user_name: String,
    pub passed: bool,
    pub need_register: bool,
}


// #[tokio::main]
// async fn main() {
//     let token = "dc1d1e1566ea54e99b48b74d7520ad52e0f3aa59";
//
//
//     match verify_token(token).await {
//         Ok(result) => {
//             // 处理成功场景
//             println!("Token verification successful!");
//             println!("User ID: {}", result.user_id);
//             println!("User Code: {}", result.user_code);
//             println!("User Name: {}", result.user_name);
//             println!("Passed: {}", result.passed);
//             println!("Need Register: {}", result.need_register);
//         },
//         Err(e) => {
//             println!("Token verification failed with error: {}", e);
//         }
//     }
//
// }


pub async fn verify_token(token: &str) -> Result<VerifyTokenResult, Box<dyn StdError + Send>> {
    // 检查 token 是否存在于成功缓存中
    {
        let mut cache_success = CACHE_SUCCESS.lock().unwrap();
        if cache_success.get(token).is_some() {
            println!("Token found in success cache. Skipping verification.");
            return Ok(VerifyTokenResult {
                user_id: 0,
                user_code: "".to_string(),
                user_name: "".to_string(),
                passed: true,
                need_register: false,
            });
        }
    }

    // 检查 token 是否存在于失败缓存中
    {
        let mut cache_failure = CACHE_FAILURE.lock().unwrap();
        if cache_failure.get(token).is_some() {
            println!("Token found in failure cache. Skipping verification.");
            return Ok(VerifyTokenResult {
                user_id: 0,
                user_code: "".to_string(),
                user_name: "".to_string(),
                passed: false,
                need_register: false,
            });
        }
    }

    // 检查是否为大模型内部token
    let decrypted = decrypt(&token, KEY);
    match decrypted {
        Ok(decrypted) => {
            println!("Decrypted token: {}", decrypted);
            let parts: Vec<&str> = decrypted.split("_&_").collect();

            if parts.len() == 3 {
                let account = parts[0];
                let email = parts[1];
                let salt = parts[2];

                println!("Account: {}", account);
                println!("Email: {}", email);
                println!("Salt: {}", salt);
                return Ok(VerifyTokenResult {
                    user_id: 0,
                    user_code: account.to_string(),
                    user_name: account.to_string(),
                    passed: true,
                    need_register: true,
                });
            } else {
                println!("Invalid input format");
            }
        },
        Err(err) => {
            println!("Token is not a valid internal token : {}, cause {}", token, err);
        }
    }


    // 检查是否为研发云token
    let url = "https://dev.iwhalecloud.com/portal/zcm-cmdb/v1/access-tokens/verify";

    // 发送 POST 请求
    let response = CLIENT.post(url)
        .header("Content-Type", "application/json")
        .header("X-CSRF-TOKEN", "zcm")
        .header("ZCM-Signature", "nqaKCzL3ghK3sobCqzNRaFXhp6OFEOw5AYnxLijpR7I=")
        .body(token.to_string())
        .send()
        .await
        .map_err(|e| Box::new(e) as Box<dyn StdError + Send>)?;

    // 检查请求是否成功
    if response.status().is_success() {
        // 读取响应的 JSON 内容
        let body = response.json::<Value>().await.map_err(|e| Box::new(e) as Box<dyn StdError + Send>)?;

        // 检查校验结果
        if let Some(passed) = body.get("passed").and_then(|v| v.as_bool()) {
            if passed {
                println!("Token verification passed!");

                // 将 token 加入成功缓存
                let mut cache_success = CACHE_SUCCESS.lock().unwrap();
                cache_success.put(token.to_string(), ());

                let user_id = body.get("userId").and_then(|v| v.as_i64()).unwrap_or(0);
                let user_code = body.get("userCode").and_then(|v| v.as_str()).unwrap_or("").to_string();
                let user_name = body.get("userName").and_then(|v| v.as_str()).unwrap_or("").to_string();

                return Ok(VerifyTokenResult {
                    user_id,
                    user_code,
                    user_name,
                    passed: true,
                    need_register: true,
                });
            } else {
                println!("Token verification failed!");

                // 将 token 加入失败缓存
                let mut cache_failure = CACHE_FAILURE.lock().unwrap();
                cache_failure.put(token.to_string(), ());

                return Ok(VerifyTokenResult {
                    user_id: 0,
                    user_code: "".to_string(),
                    user_name: "".to_string(),
                    passed: false,
                    need_register: false,
                });
            }
        } else {
            return Err(Box::new(io::Error::new(io::ErrorKind::Other, "Token is invalid, 'passed' field not found or not a boolean in response JSON.")) as Box<dyn StdError + Send>);
        }
    } else {
        return Err(Box::new(io::Error::new(io::ErrorKind::Other, format!("Token is invalid, Request failed with status: {}", response.status()))) as Box<dyn StdError + Send>);
    }
}


fn decrypt(cipher_text: &str, key: &[u8]) -> Result<String, String> {
    if !cipher_text.starts_with("ailab_") {
        let msg = "cipher_text does not start with 'ailab_'".to_string();
        //info!("{}", msg);
        return Err(msg);
    }

    let key = Key::<Aes128Gcm>::from_slice(key);
    let cipher = Aes128Gcm::new(key);
    let decoded = base64::decode(&cipher_text[6..]).map_err(|e| {
        let msg = format!("base64 decode error: {}", e);
        //error!("{}", msg);
        msg
    })?;

    let (nonce, ciphertext) = decoded.split_at(12);
    let nonce = Nonce::from_slice(nonce);

    let decrypted_ciphertext = cipher.decrypt(nonce, ciphertext).map_err(|e| {
        let msg = format!("decryption error: {}", e);
        //error!("{}", msg);
        msg
    })?;
    let result = String::from_utf8(decrypted_ciphertext).map_err(|e| {
        let msg = format!("utf8 decode error: {}", e);
        //error!("{}", msg);
        msg
    })?;

    // 将 token 加入成功缓存
    let mut cache_success = CACHE_SUCCESS.lock().unwrap();
    cache_success.put(cipher_text.to_string(), ());

    Ok(result)
}
