use clap::{App, Arg, ArgMatches};

pub fn get_matches(version: Option<&str>) -> ArgMatches {
    App::new("Vulpo Auth")
        .version(version.unwrap_or(""))
        .author("Michael Riezler. <michael@riezler.co>")
        .arg(
            Arg::new("version")
                .short('v')
                .long("version")
                .required(false)
                .value_name("VERSION")
                .takes_value(false),
        )
        .arg(
            Arg::new("config")
                .short('c')
                .long("config")
                .required(false)
                .value_name("CONFIG")
                .takes_value(true),
        )
        .subcommand(
            App::new("server")
                .about("start server")
                .arg(
                    Arg::new("port")
                        .short('p')
                        .long("port")
                        .required(false)
                        .value_name("PORT")
                        .takes_value(true),
                )
                .arg(
                    Arg::new("run-migrations")
                        .long("run-migrations")
                        .required(false)
                        .value_name("RUN_MIGRATION")
                        .takes_value(false),
                ),
        )
        .subcommand(App::new("migrations").about("run migrations"))
        .subcommand(App::new("init").about("init the server"))
        .get_matches()
}
