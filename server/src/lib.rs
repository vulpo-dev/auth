#[macro_use]
extern crate rocket;

#[macro_use]
extern crate diesel_migrations;
extern crate openssl;

use include_dir::{include_dir, Dir};

pub mod admin;
pub mod config;
pub mod cors;
pub mod db;
pub mod file;
pub mod keys;
pub mod mail;
pub mod migration;
pub mod password;
pub mod passwordless;
pub mod project;
pub mod response;
pub mod session;
pub mod settings;
pub mod template;
pub mod user;

pub const ADMIN_CLIENT: Dir = include_dir!("../admin/build");
pub const TEMPLATE: Dir = include_dir!("./template");
