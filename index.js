#!/usr/bin/env node

const path = require('path');
const inquirer = require('inquirer');
const { createInterface } = require('readline');
const fs = require('fs-extra');
const {
  comparator,
  filter,
  keys,
  isEmpty,
  lt,
  map,
  omit,
  reject,
  sort,
  uniq,
} = require('ramda');

const root = path.resolve(process.cwd());

const gitIgnore = reject(
  item => isEmpty(item) || /^#/.test(item),
  fs.readFileSync(path.join(root, '.gitignore')).toString().split('\n'),
);

const pkg = fs.readJsonSync(path.join(root, 'package.json'));

let deps = sort(comparator(lt), keys({
  ...pkg.dependencies,
  ...pkg.devDependencies,
}));


const processFile = (file, folder) => new Promise((resolve) => {
  if (file.isFile()) {
    const readLine = createInterface({
      input: fs.createReadStream(path.join(folder, file.name)),
      crlfDelay: Infinity,
    });

    readLine.on('line', (line) => {
      deps.forEach((dep) => {
        if (line.includes(dep)) {
          deps = reject(item => item === dep, deps);
        }
      });
    });

    readLine.on('close', () => {
      resolve();
    });
  } else {
    resolve();
  }
});

const processFolder = async (folder, exclude = []) => {
  const directory = reject(
    ({ name }) => exclude.includes(name),
    fs.readdirSync(folder, { withFileTypes: true }),
  );

  const files = filter(file => file.isFile(), directory);
  const subDirectories = filter(file => file.isDirectory(), directory);

  return Promise.all(
    map(file => processFile(file, folder), files),
  ).then(async () => {
    if (!isEmpty(subDirectories)) {
      return Promise.all(
        map(dir => processFolder(path.join(folder, dir.name), exclude), subDirectories),
      );
    }
    return null;
  });
};


const run = async () => {
  console.log('Processing files...');

  fs.writeJsonSync(
    path.join(__dirname, '.tmpPackageJson'),
    omit(['dependencies', 'devDependencies'], pkg),
    { spaces: '\t' },
  );

  const exclude = uniq([
    'node_modules',
    '.git',
    'package.json',
    'package-lock.json',
    ...gitIgnore,
  ]);

  inquirer
    .prompt([
      {
        type: 'input',
        message: 'Additional file/directory names to exclude (comma separated string)',
        name: 'additionalExcludes',
      },
    ])
    .then(async ({ additionalExcludes }) => {
      await processFolder(root, [
        ...exclude,
        ...(additionalExcludes || '').split(','),
      ]);

      await processFile({
        name: '.tmpPackageJson',
        isFile: () => true,
      }, __dirname);

      return inquirer
        .prompt([
          {
            type: 'checkbox',
            message: 'Select modules to remove',
            name: 'modules',
            choices: [
              ...map(module => ({ name: module }), deps),
              new inquirer.Separator('---------------'),
            ],
            validate(answer) {
              if (answer.length < 1) {
                return 'You must choose at least one module.';
              }

              return true;
            },
          },
        ])
        .then(({ modules }) => {
          console.log(JSON.stringify(modules, null, '  '));
          fs.removeSync(path.join(__dirname, '.tmpPackageJson'));
          console.log('Finished processing files.');
        });
    });
};

run();
