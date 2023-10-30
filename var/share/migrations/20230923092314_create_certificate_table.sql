-- migrate:up
CREATE TABLE "certificate"
(
    "id"            SERIAL PRIMARY KEY,
    "subject"       VARCHAR(255)              NOT NULL,
    "name"          VARCHAR(255)              NOT NULL,
    "serial_number" BIGINT                    NOT NULL UNIQUE,
    "description"   TEXT                      NULL,
    "created_at"    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at"    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "tags"          JSONB                     NULL,
    "ca_id"         INTEGER                   NULL REFERENCES "ca" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TRIGGER "set_timestamp"
    BEFORE UPDATE
    ON "certificate"
    FOR EACH ROW
EXECUTE PROCEDURE "trigger_set_timestamp"();

-- migrate:down
DROP TABLE "certificate";
