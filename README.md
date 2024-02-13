# Lokoguard Crashlytics SDK

This SDK will help to capture all the uncaught exceptions and as well as log known exceptions to lokoguard.

**Available methods -**
- manager.set_creds("<base_url>", "<auth_token>")
- manager.set_additional_info({<app_info_in_json>})
- manager.log_exception(<exception>)