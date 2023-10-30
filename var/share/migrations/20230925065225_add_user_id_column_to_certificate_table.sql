-- migrate:up
-- noinspection SqlAddNotNullColumn
ALTER TABLE "certificate"
    ADD COLUMN "user_id" BIGINT NOT NULL;
ALTER TABLE "certificate"
    ADD CONSTRAINT "certificate_user_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "auth"."user"
            ON UPDATE CASCADE ON DELETE CASCADE;

-- migrate:down
ALTER TABLE "certificate"
    DROP CONSTRAINT "certificate_user_id_fk";
ALTER TABLE "certificate"
    DROP COLUMN "user_id";
