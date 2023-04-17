use clap::{ArgMatches, Command};
use werkbank::clap::args::{config, init, migrations, server, version};

pub fn get_matches() -> ArgMatches {
    Command::new("Vulpo Auth")
        .author("Michael Riezler. <michael@riezler.co>")
        .arg(version())
        .arg(config())
        .subcommand(server())
        .subcommand(migrations())
        .subcommand(init())
        .subcommand(Command::new("key-gen").about("generate a public and private key pair"))
        .get_matches()
}
