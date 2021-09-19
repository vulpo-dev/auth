use rocket::Route;

pub mod data;
mod delete_account;
mod disable;
mod get;
mod list;
mod sign_out;
mod update;
pub mod verify_email;
mod set_password;
mod change_email;

pub fn routes() -> Vec<Route> {
    routes![
        get::handler,
        get::admin_handler,
        list::handler,
        list::total,
        sign_out::sign_out,
        sign_out::sign_out_all,
        sign_out::admin_sign_out,
        delete_account::admin_delete_account,
        delete_account::delete_account,
        verify_email::handler,
        verify_email::admin,
        disable::handler,
        update::handler,
        update::admin_handler,
        set_password::set_password,
        change_email::create_email_change_request,
        change_email::confirm_email_change,
    ]
}
