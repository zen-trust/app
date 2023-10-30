-- migrate:up
CREATE TABLE "auth"."authenticator"
(
    "id"                  SERIAL PRIMARY KEY,
    "name"                VARCHAR(255)                                  NOT NULL,
    "user_id"             BIGINT                                        NOT NULL REFERENCES "auth"."user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "external_identifier" TEXT UNIQUE                                   NOT NULL,
    "public_key"          BYTEA                                         NOT NULL,
    "counter"             BIGINT                                        NOT NULL,
    "device_type"         VARCHAR(32)                                   NOT NULL,
    "backed_up"           BOOLEAN       DEFAULT FALSE                   NOT NULL,
    "transports"          VARCHAR(32)[] DEFAULT ARRAY []::VARCHAR(32)[] NOT NULL,

    "created_at"          TIMESTAMPTZ   DEFAULT NOW()                   NOT NULL,
    "updated_at"          TIMESTAMPTZ   DEFAULT NOW()                   NOT NULL
);

CREATE TRIGGER "set_timestamp"
    BEFORE UPDATE
    ON "auth"."authenticator"
    FOR EACH ROW
EXECUTE PROCEDURE "trigger_set_timestamp"();

CREATE INDEX "authenticator_user_id_idx" ON "auth"."authenticator" ("user_id");
CREATE INDEX "authenticator_external_identifier_idx" ON "auth"."authenticator" ("external_identifier");

-- migrate:down
DROP TABLE "auth"."authenticator";
