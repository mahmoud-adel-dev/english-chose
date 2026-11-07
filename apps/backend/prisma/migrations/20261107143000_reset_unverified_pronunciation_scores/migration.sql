-- Historical pronunciation scores were inferred from text transcripts rather
-- than measured from audio. Reset them so the UI does not present them as
-- verified acoustic assessments.
UPDATE "LearningProfile"
SET "pronunciationScore" = 0.0
WHERE "pronunciationScore" <> 0.0;
