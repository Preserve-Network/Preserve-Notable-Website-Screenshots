CREATE  TABLE IF NOT EXISTS `preserve`.`snapshots` (
  `name` VARCHAR(255) NOT NULL ,
  `filename` VARCHAR(255) NOT NULL,
  `cid` VARCHAR(255) NOT NULL,
  `created` DATE NOT NULL,
  `index` INT NOT NULL,
  primary key(name, cid)
) ENGINE = InnoDB;