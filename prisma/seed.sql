/** Groups */
INSERT INTO "Group" (name, active, description)
VALUES ('Top Traders', TRUE, 'This is a top notch group of pro traders');

INSERT INTO "Group" (name, active, description)
VALUES ('Binance Raiders', TRUE, 'We dominate binance all day');

INSERT INTO "Group" (name, active, description)
VALUES ('Bull Traders', TRUE, 'No one tops the bulls!');

INSERT INTO "Group" (name, active, description)
VALUES ('Doggy Dog', FALSE, 'Still trying to figure this stuff out');


/** GroupMemberships */
INSERT INTO "GroupMembership" ("memberId", "groupId", active, role, status)
VALUES (1, 1, TRUE, 'ADMIN', 'APPROVED');

INSERT INTO "GroupMembership" ("memberId", "groupId", active, role, status)
VALUES (2, 1, TRUE, 'MEMBER', 'APPROVED');

INSERT INTO "GroupMembership" ("memberId", "groupId", active, role, status)
VALUES (4, 1, TRUE, 'MEMBER', 'PENDING');

INSERT INTO "GroupMembership" ("memberId", "groupId", active, role, status)
VALUES (3, 1, FALSE, 'MEMBER', 'DENIED');

INSERT INTO "GroupMembership" ("memberId", "groupId", active, role, status)
VALUES (6, 1, TRUE, 'MEMBER', 'PENDING');

INSERT INTO "GroupMembership" ("memberId", "groupId", active, role, status)
VALUES (2, 2, TRUE, 'ADMIN', 'APPROVED');

INSERT INTO "GroupMembership" ("memberId", "groupId", active, role, status)
VALUES (4, 2, TRUE, 'TRADER', 'APPROVED');

INSERT INTO "GroupMembership" ("memberId", "groupId", active, role, status)
VALUES (6, 2, TRUE, 'MEMBER', 'APPROVED');

INSERT INTO "GroupMembership" ("memberId", "groupId", active, role, status)
VALUES (3, 3, TRUE, 'ADMIN', 'APPROVED');

INSERT INTO "GroupMembership" ("memberId", "groupId", active, role, status)
VALUES (5, 3, TRUE, 'MEMBER', 'PENDING');

INSERT INTO "GroupMembership" ("memberId", "groupId", active, role, status)
VALUES (5, 4, TRUE, 'ADMIN', 'APPROVED');

INSERT INTO "GroupMembership" ("memberId", "groupId", active, role, status)
VALUES (3, 4, TRUE, 'MEMBER', 'APPROVED');

INSERT INTO "GroupMembership" ("memberId", "groupId", active, role, status)
VALUES (4, 4, FALSE, 'TRADER', 'PENDING');