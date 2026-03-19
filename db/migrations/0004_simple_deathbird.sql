CREATE TABLE `password_resets` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`otp` varchar(6) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `password_resets_id` PRIMARY KEY(`id`)
);
