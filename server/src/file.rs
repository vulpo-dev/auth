use std::io::Cursor;

use include_dir::File as VirtualFile;
use rocket::http::{ContentType, Status};
use rocket::request::Request;
use rocket::response::{self, Responder, Response};
use std::ffi::OsStr;

#[derive(Debug)]
pub struct File(VirtualFile<'static>);

impl File {
    pub fn from(file: VirtualFile<'static>) -> File {
        File(file)
    }
}

impl<'r> Responder<'r, 'static> for File {
    fn respond_to(self, _: &'r Request<'_>) -> response::Result<'static> {
        let File(file) = self;

        let extension = match file.path().extension() {
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

        let content = file.contents();
        Response::build()
            .sized_body(content.len(), Cursor::new(content))
            .header(content_type)
            .ok()
    }
}
