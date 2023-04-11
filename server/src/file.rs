use include_dir::File as VirtualFile;
use rocket::http::{ContentType, Status};
use rocket::request::Request;
use rocket::response::{self, Responder, Response};
use std::ffi::OsStr;
use std::io::Cursor;
use std::path::Path;

#[derive(Debug)]
pub struct File {
    pub path: String,
    pub contents: Vec<u8>,
}

impl File {
    pub fn from(file: VirtualFile<'static>) -> File {
        File {
            path: file.path().to_str().unwrap().to_string(),
            contents: file.contents().to_vec(),
        }
    }

    pub fn new(path: &str, contents: &Vec<u8>) -> File {
        File {
            path: path.to_string(),
            contents: contents.clone(),
        }
    }
}

impl<'r> Responder<'r, 'static> for File {
    fn respond_to(self, _: &'r Request<'_>) -> response::Result<'static> {
        let path = Path::new(&self.path);
        let extension = match path.extension() {
            Some(ext) => ext,
            None => OsStr::new("html"),
        };

        let extension = match extension.to_str() {
            Some(ext) => ext,
            None => return Err(Status::BadRequest),
        };

        let content_type = match ContentType::from_extension(&extension) {
            Some(ct) => ct,
            None => ContentType::new("text", "html"),
        };

        let content = self.contents;
        Response::build()
            .sized_body(content.len(), Cursor::new(content.to_owned()))
            .header(content_type)
            .ok()
    }
}
