use rocket::Route;

mod change_email;
pub mod data;
mod delete_account;
mod disable;
mod get;
mod list;
mod set_password;
mod sign_out;
mod update;
pub mod verify_email;

pub fn routes() -> Vec<Route> {
    routes![
        get::handler,
        get::admin_handler,
        list::handler,
        list::total,
        sign_out::sign_out_handler,
        sign_out::sign_out_all_handler,
        sign_out::admin_sign_out_handler,
        delete_account::admin_delete_account_handler,
        delete_account::delete_account_handler,
        verify_email::handler,
        verify_email::admin,
        disable::handler,
        update::handler,
        update::admin_handler,
        set_password::handler,
        change_email::create_email_change_request_handler,
        change_email::confirm_email_change_handler,
        change_email::reset_email_change_handler,
    ]
}
