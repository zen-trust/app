-- migrate:up
CREATE TABLE "ca"
(
    "id"                    SERIAL PRIMARY KEY,
    "subject"               VARCHAR(255)              NOT NULL,
    "description"           TEXT                      NULL,
    "certificate"           BYTEA                     NOT NULL,
    "encrypted_private_key" BYTEA                     NOT NULL,
    "serial_number"         BIGINT                    NOT NULL UNIQUE,
    "created_at"            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at"            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "valid_from"            TIMESTAMPTZ               NOT NULL,
    "valid_until"           TIMESTAMPTZ               NOT NULL,
    "is_revoked"            BOOLEAN     DEFAULT FALSE NOT NULL,
    "active"                BOOLEAN     DEFAULT FALSE NOT NULL,
    "tags"                  JSONB                     NULL,
    "root_ca_id"            INTEGER                   NOT NULL REFERENCES "root_ca" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TRIGGER "set_timestamp"
    BEFORE UPDATE
    ON "ca"
    FOR EACH ROW
EXECUTE PROCEDURE "trigger_set_timestamp"();

-- migrate:down
DROP TABLE "ca";
