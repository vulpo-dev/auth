use handlebars::Handlebars;
use include_dir::{include_dir, Dir};
use serde_json::json;

const TEMPLATE: Dir = include_dir!("./src/template");

struct File {
    pub path: &'static str,
    pub name: &'static str,
}

const FILES: [File; 3] = [
    File {
        path: "index.hbs",
        name: "index",
    },
    File {
        path: "partial/passwordless.hbs",
        name: "passwordless",
    },
    File {
        path: "partial/button.hbs",
        name: "button",
    },
];

#[derive(Debug)]
pub struct Template {}

impl Template {
    pub fn passwordless(link: String) -> String {
        let mut handlebars = Handlebars::new();

        FILES.iter().for_each(|file| {
            let content = TEMPLATE
                .get_file(file.path)
                .unwrap()
                .contents_utf8()
                .unwrap();

            assert!(handlebars
                .register_template_string(file.name, content)
                .is_ok());
        });

        let content = handlebars
            .render("passwordless", &json!({ "href": link }))
            .unwrap();

        handlebars
            .render("index", &json!({ "content": content }))
            .unwrap()
    }
}
