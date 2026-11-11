-- ==============================================================================
-- LIVE DB FIX: POPULATE TEMPORARY PASSWORDS & PASSWORDS HASHES FOR ALL 53 MEMBERS
-- ==============================================================================


-- 1. Ensure email_templates exists for BOTH tenant IDs (11111111-1111-1111-1111-111111111111 & 00000000-0000-0000-0000-000000000001)
INSERT INTO public.email_templates (id, tenant_id, template_code, name, subject, body_html, variables, is_active, updated_at)
SELECT gen_random_uuid(), t.tid, 'MEMBER_WELCOME_CREDENTIALS', 'Member Welcome & Credentials',
       'Welcome to SETHU — Your Account Credentials & Portal Access',
       e.body_html, e.variables, true, now()
FROM (VALUES 
    ('11111111-1111-1111-1111-111111111111'::uuid),
    ('00000000-0000-0000-0000-000000000001'::uuid)
) AS t(tid)
CROSS JOIN (
    SELECT body_html, variables FROM public.email_templates LIMIT 1
) e
ON CONFLICT (tenant_id, template_code) DO NOTHING;

-- 2. Update temporary_password in sethu_legacy_members and PasswordHash in user_identities


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@9529Z' 
WHERE membership_id = 'DBN-CHN-0001';

UPDATE public.user_identities 
SET "PasswordHash" = 'm2P67k2u9GkcJTEtXG7AlA==:k/7sGlV25OlGim9lkE6f9Ax7OyKLNxIPej/wwdzZ2Mc=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0001' OR lower(trim("Email")) = 'venkatcreative@yahoo.co.in';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@2876I' 
WHERE membership_id = 'DBN-CHN-0002';

UPDATE public.user_identities 
SET "PasswordHash" = 'QtgvMHgGz5fkBNyZ//YIHA==:evY+QeQUiAKkXIdw0wMi1+kYcpbT3YXrhOOiun7slik=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0002' OR lower(trim("Email")) = 'psureshs@yahoo.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@6920Z' 
WHERE membership_id = 'DBN-CHN-0003';

UPDATE public.user_identities 
SET "PasswordHash" = 'X3ZEsowihEjwLuWpbgCScQ==:IyxwBDX1grCtU+tkanhQE8X7lDTo78XAKDm/P/OAw4M=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0003' OR lower(trim("Email")) = 'vs.shresyasrao@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@9350E' 
WHERE membership_id = 'DBN-CHN-0004';

UPDATE public.user_identities 
SET "PasswordHash" = 'uQc0rVmf8eMNXTXH6JCdxQ==:MTIZm/uq5IyyiuMgqs9lukMS/r18+wXa+oVnVFGQDZ0=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0004' OR lower(trim("Email")) = 'prasad@harmonyhomes.in';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@4610P' 
WHERE membership_id = 'DBN-CHN-0005';

UPDATE public.user_identities 
SET "PasswordHash" = 'XVpXX6TWGRj8bEE8dwxcaQ==:kJtgsUOV4D8GP07VRu0KD6MA/yoRQaV9QxGLrMBgkOk=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0005' OR lower(trim("Email")) = 'spsmurrali@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@8145T' 
WHERE membership_id = 'DBN-CHN-0006';

UPDATE public.user_identities 
SET "PasswordHash" = '9M/gQfBblOZlPK2apySM2w==:v04+D4tiySpRL/Ov1Cz+2bJl4I+M8+15rgiYwMvVFNU=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0006' OR lower(trim("Email")) = 'balaganesan.k@4quadra.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@1916S' 
WHERE membership_id = 'DBN-CHN-0007';

UPDATE public.user_identities 
SET "PasswordHash" = '7PhH59BbUr3NsnqfkqUquQ==:a6CFmwYOSvOh5DaNew2/WWSRGSZMkfNApE/0RUpTfF8=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0007' OR lower(trim("Email")) = 'venkat@coachvenkat.in';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@5513X' 
WHERE membership_id = 'DBN-CHN-0008';

UPDATE public.user_identities 
SET "PasswordHash" = 'xgAlnnVZHqOydjNj3H3Okg==:vQE8rxhg1xjGjOMgfrsybA2JOE/4W6Eb0Fy4dvHRlRE=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0008' OR lower(trim("Email")) = 'krajaganesaniyer@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@2906L' 
WHERE membership_id = 'DBN-CHN-0009';

UPDATE public.user_identities 
SET "PasswordHash" = '5zwpNZSsATnfCrOYzfvlGg==:MM2Fw48Dc5rMcQvE7KtlYw2m0DnKW/d3TmKcRr31IdI=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0009' OR lower(trim("Email")) = 'viswanathanhalasyam@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@9135A' 
WHERE membership_id = 'DBN-CHN-0010';

UPDATE public.user_identities 
SET "PasswordHash" = 'In7J/K//uy7X9v0OC0dx/Q==:fcA/RTOnmDLnhGlhCh4aXOnjzm28nfXkNaSDs1OGN9I=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0010' OR lower(trim("Email")) = 'lgmanand@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@5374F' 
WHERE membership_id = 'DBN-CHN-0011';

UPDATE public.user_identities 
SET "PasswordHash" = '0ug+5f/ul/BpMcsIP8Whfg==:WAIXvvYPq61yWrqW4mPXq3GRv7i6Xc12QxXbCFyO8n0=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0011' OR lower(trim("Email")) = 'babainsurance5@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@9205C' 
WHERE membership_id = 'DBN-CHN-0012';

UPDATE public.user_identities 
SET "PasswordHash" = 'mgXY7/7dsiHIuags9FeDaA==:H0TCQBe7gpFBRthp5/f7OsyzLoU2E+jCWbRaTr4wvmw=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0012' OR lower(trim("Email")) = 'k.kamal@k2tours.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@4633E' 
WHERE membership_id = 'DBN-CHN-0013';

UPDATE public.user_identities 
SET "PasswordHash" = 'ndmsPEUAmIjHEXU+/m/TiA==:vfzSIyZR00klZNtmSDivteG+C3fqn5mQo/IqIXjd2AQ=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0013' OR lower(trim("Email")) = 'sridhar.ashok13@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@8672K' 
WHERE membership_id = 'DBN-CHN-0014';

UPDATE public.user_identities 
SET "PasswordHash" = '7ORmmHxlJ8oVKC2XLn9mlQ==:b8vGuU4vPm2nE3noNjrG9hPS0FiK00VEPRs5fCgpr74=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0014' OR lower(trim("Email")) = 'prahalathan.ratech@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@3478A' 
WHERE membership_id = 'DBN-CHN-0015';

UPDATE public.user_identities 
SET "PasswordHash" = '9gEAu5q7AKHgQcW2Vxmxdw==:rzjCY0+Ze7N8u91/8+7MWRseC7cwQ1RKQIR/6TPGbG4=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0015' OR lower(trim("Email")) = 'sridharabathsagayam@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@7951Z' 
WHERE membership_id = 'DBN-CHN-0016';

UPDATE public.user_identities 
SET "PasswordHash" = 'gCXxtiwKy6nf6UbCvU/bpg==:9kWyE7S3Ay/qDZtvC99pwQchNZvYndU9hZgxVbDWOuE=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0016' OR lower(trim("Email")) = 'shrichandrasekhara@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@3293H' 
WHERE membership_id = 'DBN-CHN-0017';

UPDATE public.user_identities 
SET "PasswordHash" = 's2dGh0uTZEYy+CHgy9UjeQ==:VVYTfF1QLfCqSRX70yhRuFra7EuGYxVhHcn7yt57QIc=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0017' OR lower(trim("Email")) = 'tvmk12@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@8832A' 
WHERE membership_id = 'DBN-CHN-0018';

UPDATE public.user_identities 
SET "PasswordHash" = 'pQvxuJF0q0O5p6RvcCKm9w==:RQsvCAfIlFzk0hpOltgMp6CpBxb2Fx/KmZGGlbz/2hU=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0018' OR lower(trim("Email")) = 'ananthkr2003@yahoo.co.in';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@6848U' 
WHERE membership_id = 'DBN-CHN-0019';

UPDATE public.user_identities 
SET "PasswordHash" = 'Cazjv48IYsdCUnVx7/Gv7g==:nDbSobTI7d0Bj+X4nJ1GCtm7dJFYwvj2qZ3F0xr6TLM=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0019' OR lower(trim("Email")) = 'sriram.abathsagayam@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@2177T' 
WHERE membership_id = 'DBN-CHN-0020';

UPDATE public.user_identities 
SET "PasswordHash" = 'vRd1plc3bpiVY0DmlkA3Uw==:A7zFX2uC+zNe7XDT0AFKYha4MKeW/4dAQrAe7v7ocW8=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0020' OR lower(trim("Email")) = 'buysellandrent86@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@1295L' 
WHERE membership_id = 'DBN-CHN-0021';

UPDATE public.user_identities 
SET "PasswordHash" = 'JRTmKfad5MyFBa8CkE+wXA==:eD/QUlzsDzvVXZqL5jJv6G1BaBzHmsad1uQEdgEoaao=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0021' OR lower(trim("Email")) = 'saswin1997@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@9956T' 
WHERE membership_id = 'DBN-CHN-0022';

UPDATE public.user_identities 
SET "PasswordHash" = 't8oIM9JQx1qcHZ2leZMTyQ==:Ap+mm++4m00vhbHn3QoIokZxz5WXro4V0iJLKialL/w=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0022' OR lower(trim("Email")) = 'sramprasad@saamartya.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@9458P' 
WHERE membership_id = 'DBN-CHN-0023';

UPDATE public.user_identities 
SET "PasswordHash" = 'cj1LZDrDCvcOq9QKuSTYJg==:JJs6TMNt9zYixwZLeK3nH++o556ZYnO+dLh/qWlOmr0=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0023' OR lower(trim("Email")) = 'rk1966@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@7891F' 
WHERE membership_id = 'DBN-CHN-0024';

UPDATE public.user_identities 
SET "PasswordHash" = 'tpy5zNeP4xoA0E2BnxRrdQ==:br35vP1Pu9CEi5zkQFWo9urZBUn04bIv32g7roYxbXI=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0024' OR lower(trim("Email")) = 'krishnamumar@horizonconstrctions.biz';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@8099Q' 
WHERE membership_id = 'DBN-CHN-0025';

UPDATE public.user_identities 
SET "PasswordHash" = 'lkTytRJNPS4vkyHQTzE7wg==:TWVch0HLOePH+KnoAq9OKx8cGR+Bl9O9BFLeWSo6TEs=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0025' OR lower(trim("Email")) = 'srkkrishnan@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@4016F' 
WHERE membership_id = 'DBN-CHN-0026';

UPDATE public.user_identities 
SET "PasswordHash" = 'E338qLvS+/cvnDUto0MlgA==:pgTzUnStIBFbxhUeYFf7cNgzdeZgWKJ9Z253/HB+qmQ=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0026' OR lower(trim("Email")) = 'foxboxsolutions@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@9291R' 
WHERE membership_id = 'DBN-CHN-0027';

UPDATE public.user_identities 
SET "PasswordHash" = 'Kf3o4r0nNz9XBq3U8+dJLg==:mYf+ke8BufgsMuLxldVoa5cXxHELuupqab9gMLolu7A=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0027' OR lower(trim("Email")) = 'charitarthkannan@gmai.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@7631V' 
WHERE membership_id = 'DBN-CHN-0028';

UPDATE public.user_identities 
SET "PasswordHash" = 'fJAf8I36KmR0Hk0QHEfdIg==:YxQ2aBuMidANTlqJiFyaWaR9zLecrf7lnAmAEXGsFaE=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0028' OR lower(trim("Email")) = 'ramana@huemonk.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@7325O' 
WHERE membership_id = 'DBN-CHN-0029';

UPDATE public.user_identities 
SET "PasswordHash" = 'f8u2tNI9vxMqbh8YP2E7Ng==:mFZZ927WTw3Ldcxfao8nn5bg5O+SOI0T/dSKtrySpTo=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0029' OR lower(trim("Email")) = 'thkrishnan.ssa@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@3089W' 
WHERE membership_id = 'DBN-CHN-0030';

UPDATE public.user_identities 
SET "PasswordHash" = 'JbpmC8ZASckCT1vxpdyI4A==:j7SoJsnk0ZJy8oeJ1CzOpMM+HGNFGRopT9ywe/36Bsk=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0030' OR lower(trim("Email")) = 'r.matthuresh@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@9658Y' 
WHERE membership_id = 'DBN-CHN-0031';

UPDATE public.user_identities 
SET "PasswordHash" = 'eC5Iu+gIhmDLmzhCBHl4/A==:3iWZLiDOb8V2ENNSK6W8VOJxywRI48/NT0AHNB2f3EM=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0031' OR lower(trim("Email")) = 'srinihy@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@9875G' 
WHERE membership_id = 'DBN-CHN-0032';

UPDATE public.user_identities 
SET "PasswordHash" = '/ROdJ3eM6Z2SO0drn4cbyw==:GZM6XCP1fIj2W+ulct5TVecO2XlX0ITxxBjo06cnVyA=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0032' OR lower(trim("Email")) = 'tallynaga@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@4525G' 
WHERE membership_id = 'DBN-CHN-0033';

UPDATE public.user_identities 
SET "PasswordHash" = 'Qr1khGWDNjExjSHKkpa9BA==:PKeBB44cADpR5KtkA4HAH+usyRkRz45ZPNX9cVsnVrk=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0033' OR lower(trim("Email")) = 'paintersindia13@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@3303P' 
WHERE membership_id = 'DBN-CHN-0034';

UPDATE public.user_identities 
SET "PasswordHash" = 'cYA+gzEDmM1Z1q+YfuBfoA==:iwfJeleCI4W5367afziS158kz+RmO9bf2C1HshBdYLo=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0034' OR lower(trim("Email")) = 'drchitaa@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@3289W' 
WHERE membership_id = 'DBN-CHN-0042';

UPDATE public.user_identities 
SET "PasswordHash" = 'kGow9d09ldsAtgvVY8599Q==:BydxRZqq4tIchI8dEvTvVVEGk2gsRhhRhHNFISX+Amk=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0042' OR lower(trim("Email")) = 'ananthanarayantd@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@8864D' 
WHERE membership_id = 'DBN-CHN-0043';

UPDATE public.user_identities 
SET "PasswordHash" = '3UNOuUo66x1SNBj/qlZamA==:i/0IAocwMAklH4NkKx7j72KeQzXtlDtwiO2YsQbC5g4=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0043' OR lower(trim("Email")) = 'rangachary.srininvasan@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@8014F' 
WHERE membership_id = 'DBN-CHN-0062';

UPDATE public.user_identities 
SET "PasswordHash" = 'mD+fLEDb/C55ExmclAdt3w==:Hz2i2cidxwqu3cOm54JNw9mw47i/E13L9cgIdWPL9eI=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0062' OR lower(trim("Email")) = 'revathi@digitalseo.in';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@7577Q' 
WHERE membership_id = 'DBN-CHN-0035';

UPDATE public.user_identities 
SET "PasswordHash" = 'Ubs/EaWNI2nsnyxdpkAorw==:CdaVqwJDP1wpeqzpT62LHXQ3SP/y0PJSj9BrXT3wEKc=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0035' OR lower(trim("Email")) = 'drjcsuresh@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@2782H' 
WHERE membership_id = 'DBN-CHN-0036';

UPDATE public.user_identities 
SET "PasswordHash" = 'xiRWm62/Bbcoxk7Uy+SmdA==:u/TQ4Ck0gLitSqJ+YBxSe83s+2L2ozaIPaaqOhYf0Mg=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0036' OR lower(trim("Email")) = 'srividhya0806@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@2853S' 
WHERE membership_id = 'DBN-CHN-0037';

UPDATE public.user_identities 
SET "PasswordHash" = 'Kd7ou6HQ3DAX8zmLl7KPEw==:IS4RRgxBME3gDbwxxxTehWgYPJnij87Gv+6nrxWWzzk=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0037' OR lower(trim("Email")) = 'rajaram.muthukrishnan@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@9137Y' 
WHERE membership_id = 'DBN-CHN-0038';

UPDATE public.user_identities 
SET "PasswordHash" = '6aser++pvRLkFAgR1XJdkg==:XGzWwxgJVkNMNZv/04zmT2A2+edrx3AWUapGbkphwu8=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0038' OR lower(trim("Email")) = 'h.sriram@atribs.in';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@3841F' 
WHERE membership_id = 'DBN-CHN-0039';

UPDATE public.user_identities 
SET "PasswordHash" = 'BTNpZwgeC0HKQen18MdbpQ==:9hDIOozcPrST8Oluoe7ztUQqTbB2R8n5z0V83QAp+cU=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0039' OR lower(trim("Email")) = 'support@consultrr.in';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@5742I' 
WHERE membership_id = 'DBN-CHN-0045';

UPDATE public.user_identities 
SET "PasswordHash" = 'ku1GGNBiq4tn6YbTXSAsMg==:VX8nNZY2znjdujPFF1mrQcYCOCkJYcoxsTi9NqIFh/E=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0045' OR lower(trim("Email")) = 'natra66@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@5180I' 
WHERE membership_id = 'DBN-CHN-0046';

UPDATE public.user_identities 
SET "PasswordHash" = '5jg8IFyzMSI0V2qvEq5Q2Q==:3X7m8SE52jnih8c6NpMSKIISgRp5nYJBiNSQJCXfHSI=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0046' OR lower(trim("Email")) = 'divyaram2609@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@2154S' 
WHERE membership_id = 'DBN-CHN-0047';

UPDATE public.user_identities 
SET "PasswordHash" = 'paoB9cN9KO39KcC7ETHkCA==:qeUSA7sARMAqomLIWTzbEd7yU8uusl+NcGiJ67lXUDk=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0047' OR lower(trim("Email")) = 'glax2203@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@3457P' 
WHERE membership_id = 'DBN-CHN-0048';

UPDATE public.user_identities 
SET "PasswordHash" = 'rCBgaX165WuS3XCP8GUExQ==:uJgtFbynQoIY1GpuWJvCx2+i+8u48SmC+pH9FOnknf4=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0048' OR lower(trim("Email")) = 'rbadhri@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@1315B' 
WHERE membership_id = 'DBN-CHN-0049';

UPDATE public.user_identities 
SET "PasswordHash" = 'kTs/xDWq8sT3ybvYR6JlxQ==:SF3iYALjSnAxEwdaZXMZ+btBVqwXOdm2L46OOE/Jcnc=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0049' OR lower(trim("Email")) = 'e2erc.coach@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@5984I' 
WHERE membership_id = 'DBN-CHN-0050';

UPDATE public.user_identities 
SET "PasswordHash" = 'DZPd/eXzDPmaG+zPHDq1CQ==:BZuOgTW3epkSQ7FxTgpJ9laY61Vgrpw4uAzlUV+DDDw=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0050' OR lower(trim("Email")) = 'opportunityinfinity@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@7313G' 
WHERE membership_id = 'DBN-CHN-0052';

UPDATE public.user_identities 
SET "PasswordHash" = 'GFR240qvrk1dYkHlhFugXw==:cyoN8xs98jzDOYokO4omRs3GqsduyuJVu5k6M4MezUg=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0052' OR lower(trim("Email")) = 'srikanthraghavan123@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@7963M' 
WHERE membership_id = 'DBN-CHN-0055';

UPDATE public.user_identities 
SET "PasswordHash" = 'ciOpuKrszrR2rNY6vaP7uA==:gNzYFySguxweBby0y/3O8m1gFBMYTlguSubqFEkzsLc=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0055' OR lower(trim("Email")) = 'raj@arsenalitc.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@1041Z' 
WHERE membership_id = 'DBN-CHN-0056';

UPDATE public.user_identities 
SET "PasswordHash" = 'iJOYnXuC/S/CwNHIQxinIw==:tGnBilAb9duPtr4OLcvPIwxi14GKguZLE/V29C8IQiM=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0056' OR lower(trim("Email")) = 'harishankarpadmanabhan666@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@3544Y' 
WHERE membership_id = 'DBN-CHN-0057';

UPDATE public.user_identities 
SET "PasswordHash" = 'wGZmTgSAtgvyAyBnLAi/aQ==:BXIIgCpAZXWi20Kfi3lzSnMek9cUeiZ7/Xcdu9G2Q+I=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0057' OR lower(trim("Email")) = 'malathimurali112@gmail.com';


UPDATE public.sethu_legacy_members 
SET temporary_password = 'Sethu@1471A' 
WHERE membership_id = 'DBN-CHN-0060';

UPDATE public.user_identities 
SET "PasswordHash" = 'U+PnjFFsrBgv6WlrfWw9RA==:dKCgWaVREQZEbjmBatBIGWTQP+SlfNl8eLC6klcxKhc=', "Active" = true, "IsContactVerified" = true, "FailedLoginAttempts" = 0
WHERE "Subject" = 'DBN-CHN-0060' OR lower(trim("Email")) = 'aatraj@gmail.com';
