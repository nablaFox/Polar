import chalk from 'chalk'

export const error = chalk.bold.red
export const warning = chalk.hex('#FFA500')

export const logError = message => console.log(error('\nError:'), message)
export const logSuccess = (message) => console.log(chalk.bold.green('\nDone!'), message)