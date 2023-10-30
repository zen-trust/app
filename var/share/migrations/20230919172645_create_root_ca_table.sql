-- migrate:up
CREATE TABLE "root_ca"
(
    "id"                    SERIAL PRIMARY KEY,
    "subject"               VARCHAR(255)              NOT NULL,
    "certificate"           BYTEA                     NOT NULL,
    "encrypted_private_key" BYTEA                     NOT NULL,
    "serial_number"         BIGINT                    NOT NULL UNIQUE,
    "created_at"            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at"            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "valid_from"            TIMESTAMPTZ               NOT NULL,
    "valid_until"           TIMESTAMPTZ               NOT NULL,
    "is_revoked"            BOOLEAN     DEFAULT FALSE NOT NULL,
    "active"                BOOLEAN     DEFAULT FALSE NOT NULL,
    "tags"                  JSONB                     NULL
);

CREATE TRIGGER "set_timestamp"
    BEFORE UPDATE
    ON "root_ca"
    FOR EACH ROW
EXECUTE PROCEDURE "trigger_set_timestamp"();

-- migrate:down
DROP TABLE "root_ca";
