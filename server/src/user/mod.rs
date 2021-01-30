use rocket::Route;

mod delete_account;
mod get;
mod list;
mod sign_out;

pub fn routes() -> Vec<Route> {
    routes![
        get::handler,
        list::handler,
        list::total,
        sign_out::sign_out,
        sign_out::sign_out_all,
        sign_out::admin_sign_out,
        delete_account::admin_delete_account,
        delete_account::delete_account,
    ]
}
