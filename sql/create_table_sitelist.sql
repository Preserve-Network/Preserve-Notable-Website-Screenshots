CREATE  TABLE IF NOT EXISTS `preserve`.`sitelist` (
  `name` VARCHAR(255),
  `url` VARCHAR(255) NOT NULL,
  `status` INT DEFAULT 0,
  primary key(url)
) ENGINE = InnoDB;