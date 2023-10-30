-- migrate:up
-- noinspection SqlAddNotNullColumn
ALTER TABLE "root_ca"
    ADD COLUMN "user_id" BIGINT NOT NULL;
ALTER TABLE "root_ca"
    ADD CONSTRAINT "root_ca_user_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "auth"."user"
            ON UPDATE RESTRICT ON DELETE RESTRICT;

-- noinspection SqlAddNotNullColumn
ALTER TABLE "ca"
    ADD COLUMN "user_id" BIGINT NOT NULL;
ALTER TABLE "ca"
    ADD CONSTRAINT "ca_user_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "auth"."user"
            ON UPDATE RESTRICT ON DELETE RESTRICT;

-- migrate:down
ALTER TABLE "root_ca"
    DROP CONSTRAINT "root_ca_user_id_fk";
ALTER TABLE "root_ca"
    DROP COLUMN "user_id";
ALTER TABLE "ca"
    DROP CONSTRAINT "ca_user_id_fk";
ALTER TABLE "ca"
    DROP COLUMN "user_id";
