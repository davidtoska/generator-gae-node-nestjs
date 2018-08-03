'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const slugify = require('slugify');
const _ = require('lodash');
const crypto = require('crypto');

const generateKey = bits => crypto.randomBytes(Math.ceil(bits / 8)).toString('base64');

module.exports = class extends Generator {
  prompting() {
    // Have Yeoman greet the user.
    this.log(yosay(`Welcome to the ${chalk.red('gae-node')} generator!`));

    const prompts = [
      {
        name: 'project',
        message: 'What is the ID of this project?',
        store: true,
        default: slugify(this.appname)
      },
      {
        name: 'projectName',
        message: 'What is the name of this project?',
        store: true,
        default: _.startCase(this.appname)
      },
      {
        name: 'gitPath',
        message: 'What is the HTTPS git path for this project?',
        store: true
      },
      {
        name: 'adminEmail',
        message: 'What email address should we use to create the initial admin login?',
        store: true
      },
      {
        name: 'appEngineRegion',
        message: 'What google cloud region will this project run in?',
        store: true,
        default: 'us-central1'
      }
    ];

    return this.prompt(prompts).then(props => {
      // To access props later use this.props.someAnswer;
      this.props = props;
    });
  }

  writing() {
    const context = Object.assign({}, this.props, {
      project: slugify(this.props.project),
      slugify,
      _
    });

    const copyTpl = (src, dest, additionalContext) => {
      const destName = dest || src;
      const srcParam = !_.isArray(src)
        ? this.templatePath(src)
        : _.map(
            src,
            entry => (_.startsWith(entry, '!') ? entry : this.templatePath(entry))
          );

      return this.fs.copyTpl(
        srcParam,
        this.destinationPath(destName),
        _.merge(context, additionalContext || {})
      );
    };

    const copy = (src, dest) => {
      const destName = dest || src;
      return this.fs.copy(this.templatePath(src), this.destinationPath(destName));
    };

    copy('client', 'client');
    copy('server', 'server');
    copyTpl('README.md');
    copyTpl('client/package.json');
    copyTpl('server/package.json');
    copyTpl('server/config/default.json');
    copyTpl('server/config/development.json');
    copyTpl('server/config/env.json', 'server/config/dev.json', {
      env: 'dev',
      secret: generateKey(512)
    });
    copyTpl('server/config/env.json', 'server/config/uat.json', {
      env: 'uat',
      secret: generateKey(512)
    });
    copyTpl('server/config/env.json', 'server/config/prod.json', {
      env: 'prod',
      secret: generateKey(512)
    });
  }

  install() {
    this.spawnCommand('npm', ['--prefix=./server', 'install']);
    this.spawnCommand('npm', ['--prefix=./client', 'install']);
  }
};
