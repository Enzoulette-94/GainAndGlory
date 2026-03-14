DELETE FROM activity_feed WHERE type='calisthenics';

DO $$
DECLARE
  ex jsonb;
  a jsonb; b jsonb; c jsonb; d jsonb; e jsonb;
BEGIN

-- ── Titan : Full body cali ──────────────────
a := jsonb_build_object('name','Tractions');
a := a || jsonb_build_object('sets',4,'reps',32);
a := a || jsonb_build_object('set_type','reps');

b := jsonb_build_object('name','Dips');
b := b || jsonb_build_object('sets',4,'reps',40);
b := b || jsonb_build_object('set_type','reps');

c := jsonb_build_object('name','Pompes');
c := c || jsonb_build_object('sets',3,'reps',30);
c := c || jsonb_build_object('set_type','reps');

d := jsonb_build_object('name','Gainage');
d := d || jsonb_build_object('sets',3,'reps',0);
d := d || jsonb_build_object('hold_seconds',180);
d := d || jsonb_build_object('set_type','timed');

ex := jsonb_build_array(a,b,c,d);

INSERT INTO activity_feed(user_id,type,content,created_at)
VALUES (
  'a0000000-0000-0000-0000-000000000005',
  'calisthenics',
  jsonb_build_object(
    'type','calisthenics',
    'exercises_count',4,
    'total_reps',120,
    'feedback','difficile',
    'name','Full body cali',
    'skills_unlocked','[]'::jsonb,
    'exercises',ex
  ),
  '2026-03-13T09:00:00Z'
);

-- ── Rookie : Intro ──────────────────────────
a := jsonb_build_object('name','Pompes');
a := a || jsonb_build_object('sets',3,'reps',30);
a := a || jsonb_build_object('set_type','reps');

b := jsonb_build_object('name','Squats bulgares');
b := b || jsonb_build_object('sets',3,'reps',24);
b := b || jsonb_build_object('set_type','reps');

c := jsonb_build_object('name','Crunchs');
c := c || jsonb_build_object('sets',2,'reps',20);
c := c || jsonb_build_object('set_type','reps');

ex := jsonb_build_array(a,b,c);

INSERT INTO activity_feed(user_id,type,content,created_at)
VALUES (
  'a0000000-0000-0000-0000-000000000006',
  'calisthenics',
  jsonb_build_object(
    'type','calisthenics',
    'exercises_count',3,
    'total_reps',60,
    'feedback','facile',
    'name','Intro calisthenics',
    'skills_unlocked','[]'::jsonb,
    'exercises',ex
  ),
  '2026-03-12T10:00:00Z'
);

-- ── Atlas : Upper body ──────────────────────
a := jsonb_build_object('name','Tractions');
a := a || jsonb_build_object('sets',5,'reps',50);
a := a || jsonb_build_object('set_type','reps');

b := jsonb_build_object('name','Dips');
b := b || jsonb_build_object('sets',5,'reps',60);
b := b || jsonb_build_object('set_type','reps');

c := jsonb_build_object('name','Pompes archer');
c := c || jsonb_build_object('sets',4,'reps',40);
c := c || jsonb_build_object('set_type','reps');

d := jsonb_build_object('name','Muscle-up');
d := d || jsonb_build_object('sets',3,'reps',15);
d := d || jsonb_build_object('set_type','reps');

e := jsonb_build_object('name','Planche');
e := e || jsonb_build_object('sets',3,'reps',0);
e := e || jsonb_build_object('hold_seconds',45);
e := e || jsonb_build_object('set_type','timed');

ex := jsonb_build_array(a,b,c,d,e);

INSERT INTO activity_feed(user_id,type,content,created_at)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'calisthenics',
  jsonb_build_object(
    'type','calisthenics',
    'exercises_count',5,
    'total_reps',200,
    'feedback','difficile',
    'name','Upper body',
    'skills_unlocked','["traction","dips"]'::jsonb,
    'exercises',ex
  ),
  '2026-03-12T19:00:00Z'
);

-- ── Valkyrie : Core ─────────────────────────
a := jsonb_build_object('name','Tractions');
a := a || jsonb_build_object('sets',3,'reps',24);
a := a || jsonb_build_object('set_type','reps');

b := jsonb_build_object('name','Pompes');
b := b || jsonb_build_object('sets',3,'reps',30);
b := b || jsonb_build_object('set_type','reps');

c := jsonb_build_object('name','L-sit');
c := c || jsonb_build_object('sets',3,'reps',0);
c := c || jsonb_build_object('hold_seconds',30);
c := c || jsonb_build_object('set_type','timed');

d := jsonb_build_object('name','Releves de jambes');
d := d || jsonb_build_object('sets',3,'reps',36);
d := d || jsonb_build_object('set_type','reps');

ex := jsonb_build_array(a,b,c,d);

INSERT INTO activity_feed(user_id,type,content,created_at)
VALUES (
  'a0000000-0000-0000-0000-000000000004',
  'calisthenics',
  jsonb_build_object(
    'type','calisthenics',
    'exercises_count',4,
    'total_reps',90,
    'feedback','modere',
    'name','Core tractions',
    'skills_unlocked','[]'::jsonb,
    'exercises',ex
  ),
  '2026-03-02T08:30:00Z'
);

END $$;
