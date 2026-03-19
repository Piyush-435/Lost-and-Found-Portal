CREATE TABLE `tokens` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`refresh_token` varchar(512) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `tokens_id` PRIMARY KEY(`id`)
);
