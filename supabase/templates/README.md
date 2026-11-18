# Supabase email templates

Made by `node scripts/build-auth-emails.mjs` (don't edit the HTML by hand; change the script
or `src/lib/email/layout.ts` and run it again).

In Supabase: **Authentication > Emails > Templates**. For each one, paste the subject and
the whole HTML file into the message body, then save.

| Supabase template | Subject | File |
|---|---|---|
| Confirm sign up | Confirm your Lucas Racing account | `confirm-signup.html` |
| Reset password | Reset your Lucas Racing password | `reset-password.html` |
| Magic link | Your Lucas Racing login link | `magic-link.html` |
| Change email address | Confirm your new email address | `change-email.html` |
| Invite user | You're invited to Lucas Racing | `invite-user.html` |
| Reauthentication | Your Lucas Racing security code | `reauthentication.html` |

The links are built from the Site URL in **Authentication > URL Configuration**, which must be
`https://lucasracing.co.uk`.
