/*
 * OAuth sign-in (Aegis) stores values longer than 255 characters: the PKCE state JSON in the verification
 * table, and the encrypted access, refresh and ID tokens in the account table.
 * SQLite does not enforce VARCHAR lengths, so only MariaDB / MySQL need the change.
 */
const columns = {
    better_auth_verification: ["value"],
    better_auth_account: ["accessToken", "refreshToken", "idToken"],
};

/**
 * @param {import("knex").Knex} knex Knex instance
 * @returns {boolean} True for MariaDB / MySQL
 */
function isMySQL(knex) {
    return String(knex.client.config.client).includes("mysql");
}

exports.up = async function (knex) {
    if (!isMySQL(knex)) {
        return;
    }

    for (const [table, names] of Object.entries(columns)) {
        await knex.schema.alterTable(table, (t) => {
            for (const name of names) {
                const column = t.text(name, "mediumtext");
                if (table === "better_auth_verification") {
                    column.notNullable();
                }
                column.alter();
            }
        });
    }
};

exports.down = async function (knex) {
    // Shrinking the columns would fail on stored values, so the change is kept
};
