use clap::{App, Arg, ArgMatches};

pub fn get_matches() -> ArgMatches {
    App::new("Auth")
        .version("1.0")
        .author("Michael Riezler. <michael@riezler.co>")
        .arg(
            Arg::new("config")
                .short('c')
                .long("config")
                .required(false)
                .value_name("CONFIG")
                .takes_value(true),
        )
        .subcommand(
            App::new("server").about("start server").arg(
                Arg::new("port")
                    .short('p')
                    .long("port")
                    .required(false)
                    .value_name("PORT")
                    .takes_value(true),
            ),
        )
        .subcommand(App::new("migrations").about("run migrations"))
        .subcommand(App::new("init").about("init the server"))
        .get_matches()
}
