use clap::{Arg, ArgMatches, Command};
use spinners::{Spinner, Spinners};
use text_io::read;
use vulpo_auth_client::{error::Result, AuthClient};

pub fn auth() -> Command {
    Command::new("auth").subcommand(
        Command::new("login")
            .arg(
                Arg::new("email")
                    .long("email")
                    .short('e')
                    .required(false)
                    .num_args(0..=1),
            )
            .arg(
                Arg::new("password")
                    .long("password")
                    .short('p')
                    .required(false)
                    .num_args(0..=1),
            ),
    )
}

pub fn is_auth(matches: &ArgMatches) -> Option<ArgMatches> {
    match matches.subcommand() {
        Some(("auth", args)) => Some(args.to_owned()),
        _ => None,
    }
}

pub async fn run_auth(auth: &AuthClient, args: &ArgMatches) -> Result<()> {
    match args.subcommand() {
        Some(("login", args)) => {
            let email = match args.get_one::<Option<String>>("email") {
                Some(email) => email.as_ref().unwrap().clone(),
                None => {
                    print!("Email: ");
                    let email: String = read!("{}\n");
                    email
                }
            };

            let password = match args.get_one::<Option<String>>("password") {
                Some(password) => password.as_ref().unwrap().clone(),
                None => {
                    let password = rpassword::prompt_password("Password: ").unwrap();
                    password
                }
            };

            let mut sp = Spinner::new(Spinners::SimpleDots, "".into());
            auth.sign_in(&email, &password).await?;
            sp.stop_with_newline();
        }

        _ => println!("Invalid command"),
    };

    Ok(())
}
