# Polar CLI

The Polar Command Line Interface (CLI) Tools can be used to deploy and manage nodejs applications on AWS EC2 instances.

## Installation

```bash
git clone https://github.com/nablaFox/Polar
cd Polar
npm i -g .
```

This will provide you with the globally accessible `polar` command.

## Setup

```bash
polar config [aws-credentials] [instance-id]
```

_(if is an istance it's not provided, will be created for you)_

## Usage

At the root of your project, run

```bash
polar init
```

this will create a `polar.yml` file where you can configure the following options:

- project: the project name
- cmd: the command to run (default: npm start)

When you want to deploy, just type

```bash
polar deploy
```

example:

## Commands

polar list

polart start [project]

polar stop [project]

polar instance off

polar instance on

polar instance status
