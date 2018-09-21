"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const tasks_1 = require("@angular-devkit/schematics/tasks");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const semver = require("semver");
const npm_1 = require("./npm");
// Angular guarantees that a major is compatible with its following major (so packages that depend
// on Angular 5 are also compatible with Angular 6). This is, in code, represented by verifying
// that all other packages that have a peer dependency of `"@angular/core": "^5.0.0"` actually
// supports 6.0, by adding that compatibility to the range, so it is `^5.0.0 || ^6.0.0`.
// We export it to allow for testing.
function angularMajorCompatGuarantee(range) {
    range = semver.validRange(range);
    let major = 1;
    while (!semver.gtr(major + '.0.0', range)) {
        major++;
        if (major >= 99) {
            // Use original range if it supports a major this high
            // Range is most likely unbounded (e.g., >=5.0.0)
            return range;
        }
    }
    // Add the major version as compatible with the angular compatible, with all minors. This is
    // already one major above the greatest supported, because we increment `major` before checking.
    // We add minors like this because a minor beta is still compatible with a minor non-beta.
    let newRange = range;
    for (let minor = 0; minor < 20; minor++) {
        newRange += ` || ^${major}.${minor}.0-alpha.0 `;
    }
    return semver.validRange(newRange) || range;
}
exports.angularMajorCompatGuarantee = angularMajorCompatGuarantee;
// This is a map of packageGroupName to range extending function. If it isn't found, the range is
// kept the same.
const peerCompatibleWhitelist = {
    '@angular/core': angularMajorCompatGuarantee,
};
function _updatePeerVersion(infoMap, name, range) {
    // Resolve packageGroupName.
    const maybePackageInfo = infoMap.get(name);
    if (!maybePackageInfo) {
        return range;
    }
    if (maybePackageInfo.target) {
        name = maybePackageInfo.target.updateMetadata.packageGroup[0] || name;
    }
    else {
        name = maybePackageInfo.installed.updateMetadata.packageGroup[0] || name;
    }
    const maybeTransform = peerCompatibleWhitelist[name];
    if (maybeTransform) {
        if (typeof maybeTransform == 'function') {
            return maybeTransform(range);
        }
        else {
            return maybeTransform;
        }
    }
    return range;
}
function _validateForwardPeerDependencies(name, infoMap, peers, logger) {
    for (const [peer, range] of Object.entries(peers)) {
        logger.debug(`Checking forward peer ${peer}...`);
        const maybePeerInfo = infoMap.get(peer);
        if (!maybePeerInfo) {
            logger.error([
                `Package ${JSON.stringify(name)} has a missing peer dependency of`,
                `${JSON.stringify(peer)} @ ${JSON.stringify(range)}.`,
            ].join(' '));
            return true;
        }
        const peerVersion = maybePeerInfo.target && maybePeerInfo.target.packageJson.version
            ? maybePeerInfo.target.packageJson.version
            : maybePeerInfo.installed.version;
        logger.debug(`  Range intersects(${range}, ${peerVersion})...`);
        if (!semver.satisfies(peerVersion, range)) {
            logger.error([
                `Package ${JSON.stringify(name)} has an incompatible peer dependency to`,
                `${JSON.stringify(peer)} (requires ${JSON.stringify(range)},`,
                `would install ${JSON.stringify(peerVersion)})`,
            ].join(' '));
            return true;
        }
    }
    return false;
}
function _validateReversePeerDependencies(name, version, infoMap, logger) {
    for (const [installed, installedInfo] of infoMap.entries()) {
        const installedLogger = logger.createChild(installed);
        installedLogger.debug(`${installed}...`);
        const peers = (installedInfo.target || installedInfo.installed).packageJson.peerDependencies;
        for (const [peer, range] of Object.entries(peers || {})) {
            if (peer != name) {
                // Only check peers to the packages we're updating. We don't care about peers
                // that are unmet but we have no effect on.
                continue;
            }
            // Override the peer version range if it's whitelisted.
            const extendedRange = _updatePeerVersion(infoMap, peer, range);
            if (!semver.satisfies(version, extendedRange)) {
                logger.error([
                    `Package ${JSON.stringify(installed)} has an incompatible peer dependency to`,
                    `${JSON.stringify(name)} (requires`,
                    `${JSON.stringify(range)}${extendedRange == range ? '' : ' (extended)'},`,
                    `would install ${JSON.stringify(version)}).`,
                ].join(' '));
                return true;
            }
        }
    }
    return false;
}
function _validateUpdatePackages(infoMap, force, logger) {
    logger.debug('Updating the following packages:');
    infoMap.forEach(info => {
        if (info.target) {
            logger.debug(`  ${info.name} => ${info.target.version}`);
        }
    });
    let peerErrors = false;
    infoMap.forEach(info => {
        const { name, target } = info;
        if (!target) {
            return;
        }
        const pkgLogger = logger.createChild(name);
        logger.debug(`${name}...`);
        const peers = target.packageJson.peerDependencies || {};
        peerErrors = _validateForwardPeerDependencies(name, infoMap, peers, pkgLogger) || peerErrors;
        peerErrors
            = _validateReversePeerDependencies(name, target.version, infoMap, pkgLogger)
                || peerErrors;
    });
    if (!force && peerErrors) {
        throw new schematics_1.SchematicsException(`Incompatible peer dependencies found. See above.`);
    }
}
function _performUpdate(tree, context, infoMap, logger, migrateOnly) {
    const packageJsonContent = tree.read('/package.json');
    if (!packageJsonContent) {
        throw new schematics_1.SchematicsException('Could not find a package.json. Are you in a Node project?');
    }
    let packageJson;
    try {
        packageJson = JSON.parse(packageJsonContent.toString());
    }
    catch (e) {
        throw new schematics_1.SchematicsException('package.json could not be parsed: ' + e.message);
    }
    const updateDependency = (deps, name, newVersion) => {
        const oldVersion = deps[name];
        // We only respect caret and tilde ranges on update.
        const execResult = /^[\^~]/.exec(oldVersion);
        deps[name] = `${execResult ? execResult[0] : ''}${newVersion}`;
    };
    const toInstall = [...infoMap.values()]
        .map(x => [x.name, x.target, x.installed])
        .filter(([name, target, installed]) => {
        return !!name && !!target && !!installed;
    });
    toInstall.forEach(([name, target, installed]) => {
        logger.info(`Updating package.json with dependency ${name} `
            + `@ ${JSON.stringify(target.version)} (was ${JSON.stringify(installed.version)})...`);
        if (packageJson.dependencies && packageJson.dependencies[name]) {
            updateDependency(packageJson.dependencies, name, target.version);
            if (packageJson.devDependencies && packageJson.devDependencies[name]) {
                delete packageJson.devDependencies[name];
            }
            if (packageJson.peerDependencies && packageJson.peerDependencies[name]) {
                delete packageJson.peerDependencies[name];
            }
        }
        else if (packageJson.devDependencies && packageJson.devDependencies[name]) {
            updateDependency(packageJson.devDependencies, name, target.version);
            if (packageJson.peerDependencies && packageJson.peerDependencies[name]) {
                delete packageJson.peerDependencies[name];
            }
        }
        else if (packageJson.peerDependencies && packageJson.peerDependencies[name]) {
            updateDependency(packageJson.peerDependencies, name, target.version);
        }
        else {
            logger.warn(`Package ${name} was not found in dependencies.`);
        }
    });
    const newContent = JSON.stringify(packageJson, null, 2);
    if (packageJsonContent.toString() != newContent || migrateOnly) {
        let installTask = [];
        if (!migrateOnly) {
            // If something changed, also hook up the task.
            tree.overwrite('/package.json', JSON.stringify(packageJson, null, 2));
            installTask = [context.addTask(new tasks_1.NodePackageInstallTask())];
        }
        // Run the migrate schematics with the list of packages to use. The collection contains
        // version information and we need to do this post installation. Please note that the
        // migration COULD fail and leave side effects on disk.
        // Run the schematics task of those packages.
        toInstall.forEach(([name, target, installed]) => {
            if (!target.updateMetadata.migrations) {
                return;
            }
            const collection = (target.updateMetadata.migrations.match(/^[./]/)
                ? name + '/'
                : '') + target.updateMetadata.migrations;
            context.addTask(new tasks_1.RunSchematicTask('@schematics/update', 'migrate', {
                package: name,
                collection,
                from: installed.version,
                to: target.version,
            }), installTask);
        });
    }
    return rxjs_1.of(undefined);
}
function _migrateOnly(info, context, from, to) {
    if (!info) {
        return rxjs_1.of();
    }
    const target = info.installed;
    if (!target || !target.updateMetadata.migrations) {
        return rxjs_1.of(undefined);
    }
    const collection = (target.updateMetadata.migrations.match(/^[./]/)
        ? info.name + '/'
        : '') + target.updateMetadata.migrations;
    context.addTask(new tasks_1.RunSchematicTask('@schematics/update', 'migrate', {
        package: info.name,
        collection,
        from: from,
        to: to || target.version,
    }));
    return rxjs_1.of(undefined);
}
function _getUpdateMetadata(packageJson, logger) {
    const metadata = packageJson['ng-update'];
    const result = {
        packageGroup: [],
        requirements: {},
    };
    if (!metadata || typeof metadata != 'object' || Array.isArray(metadata)) {
        return result;
    }
    if (metadata['packageGroup']) {
        const packageGroup = metadata['packageGroup'];
        // Verify that packageGroup is an array of strings. This is not an error but we still warn
        // the user and ignore the packageGroup keys.
        if (!Array.isArray(packageGroup) || packageGroup.some(x => typeof x != 'string')) {
            logger.warn(`packageGroup metadata of package ${packageJson.name} is malformed. Ignoring.`);
        }
        else {
            result.packageGroup = packageGroup;
        }
    }
    if (metadata['requirements']) {
        const requirements = metadata['requirements'];
        // Verify that requirements are
        if (typeof requirements != 'object'
            || Array.isArray(requirements)
            || Object.keys(requirements).some(name => typeof requirements[name] != 'string')) {
            logger.warn(`requirements metadata of package ${packageJson.name} is malformed. Ignoring.`);
        }
        else {
            result.requirements = requirements;
        }
    }
    if (metadata['migrations']) {
        const migrations = metadata['migrations'];
        if (typeof migrations != 'string') {
            logger.warn(`migrations metadata of package ${packageJson.name} is malformed. Ignoring.`);
        }
        else {
            result.migrations = migrations;
        }
    }
    return result;
}
function _usageMessage(options, infoMap, logger) {
    const packageGroups = new Map();
    const packagesToUpdate = [...infoMap.entries()]
        .map(([name, info]) => {
        const tag = options.next
            ? (info.npmPackageJson['dist-tags']['next'] ? 'next' : 'latest') : 'latest';
        const version = info.npmPackageJson['dist-tags'][tag];
        const target = info.npmPackageJson.versions[version];
        return {
            name,
            info,
            version,
            tag,
            target,
        };
    })
        .filter(({ name, info, version, target }) => {
        return (target && semver.compare(info.installed.version, version) < 0);
    })
        .filter(({ target }) => {
        return target['ng-update'];
    })
        .map(({ name, info, version, tag, target }) => {
        // Look for packageGroup.
        if (target['ng-update'] && target['ng-update']['packageGroup']) {
            const packageGroup = target['ng-update']['packageGroup'];
            const packageGroupName = target['ng-update']['packageGroupName']
                || target['ng-update']['packageGroup'][0];
            if (packageGroupName) {
                if (packageGroups.has(name)) {
                    return null;
                }
                packageGroup.forEach((x) => packageGroups.set(x, packageGroupName));
                packageGroups.set(packageGroupName, packageGroupName);
                name = packageGroupName;
            }
        }
        let command = `ng update ${name}`;
        if (tag == 'next') {
            command += ' --next';
        }
        return [name, `${info.installed.version} -> ${version}`, command];
    })
        .filter(x => x !== null)
        .sort((a, b) => a && b ? a[0].localeCompare(b[0]) : 0);
    if (packagesToUpdate.length == 0) {
        logger.info('We analyzed your package.json and everything seems to be in order. Good work!');
        return rxjs_1.of(undefined);
    }
    logger.info('We analyzed your package.json, there are some packages to update:\n');
    // Find the largest name to know the padding needed.
    let namePad = Math.max(...[...infoMap.keys()].map(x => x.length)) + 2;
    if (!Number.isFinite(namePad)) {
        namePad = 30;
    }
    const pads = [namePad, 25, 0];
    logger.info('  '
        + ['Name', 'Version', 'Command to update'].map((x, i) => x.padEnd(pads[i])).join(''));
    logger.info(' ' + '-'.repeat(pads.reduce((s, x) => s += x, 0) + 20));
    packagesToUpdate.forEach(fields => {
        if (!fields) {
            return;
        }
        logger.info('  ' + fields.map((x, i) => x.padEnd(pads[i])).join(''));
    });
    logger.info('\n');
    logger.info('There might be additional packages that are outdated.');
    logger.info('Or run ng update --all to try to update all at the same time.\n');
    return rxjs_1.of(undefined);
}
function _buildPackageInfo(tree, packages, allDependencies, npmPackageJson, logger) {
    const name = npmPackageJson.name;
    const packageJsonRange = allDependencies.get(name);
    if (!packageJsonRange) {
        throw new schematics_1.SchematicsException(`Package ${JSON.stringify(name)} was not found in package.json.`);
    }
    // Find out the currently installed version. Either from the package.json or the node_modules/
    // TODO: figure out a way to read package-lock.json and/or yarn.lock.
    let installedVersion;
    const packageContent = tree.read(`/node_modules/${name}/package.json`);
    if (packageContent) {
        const content = JSON.parse(packageContent.toString());
        installedVersion = content.version;
    }
    if (!installedVersion) {
        // Find the version from NPM that fits the range to max.
        installedVersion = semver.maxSatisfying(Object.keys(npmPackageJson.versions), packageJsonRange);
    }
    const installedPackageJson = npmPackageJson.versions[installedVersion] || packageContent;
    if (!installedPackageJson) {
        throw new schematics_1.SchematicsException(`An unexpected error happened; package ${name} has no version ${installedVersion}.`);
    }
    let targetVersion = packages.get(name);
    if (targetVersion) {
        if (npmPackageJson['dist-tags'][targetVersion]) {
            targetVersion = npmPackageJson['dist-tags'][targetVersion];
        }
        else if (targetVersion == 'next') {
            targetVersion = npmPackageJson['dist-tags']['latest'];
        }
        else {
            targetVersion = semver.maxSatisfying(Object.keys(npmPackageJson.versions), targetVersion);
        }
    }
    if (targetVersion && semver.lte(targetVersion, installedVersion)) {
        logger.debug(`Package ${name} already satisfied by package.json (${packageJsonRange}).`);
        targetVersion = undefined;
    }
    const target = targetVersion
        ? {
            version: targetVersion,
            packageJson: npmPackageJson.versions[targetVersion],
            updateMetadata: _getUpdateMetadata(npmPackageJson.versions[targetVersion], logger),
        }
        : undefined;
    // Check if there's an installed version.
    return {
        name,
        npmPackageJson,
        installed: {
            version: installedVersion,
            packageJson: installedPackageJson,
            updateMetadata: _getUpdateMetadata(installedPackageJson, logger),
        },
        target,
        packageJsonRange,
    };
}
function _buildPackageList(options, projectDeps, logger) {
    // Parse the packages options to set the targeted version.
    const packages = new Map();
    const commandLinePackages = (options.packages && options.packages.length > 0)
        ? options.packages
        : (options.all ? projectDeps.keys() : []);
    for (const pkg of commandLinePackages) {
        // Split the version asked on command line.
        const m = pkg.match(/^((?:@[^/]{1,100}\/)?[^@]{1,100})(?:@(.{1,100}))?$/);
        if (!m) {
            logger.warn(`Invalid package argument: ${JSON.stringify(pkg)}. Skipping.`);
            continue;
        }
        const [, npmName, maybeVersion] = m;
        const version = projectDeps.get(npmName);
        if (!version) {
            logger.warn(`Package not installed: ${JSON.stringify(npmName)}. Skipping.`);
            continue;
        }
        // Verify that people have an actual version in the package.json, otherwise (label or URL or
        // gist or ...) we don't update it.
        if (version.startsWith('http:') // HTTP
            || version.startsWith('file:') // Local folder
            || version.startsWith('git:') // GIT url
            || version.match(/^\w{1,100}\/\w{1,100}/) // GitHub's "user/repo"
            || version.match(/^(?:\.{0,2}\/)\w{1,100}/) // Local folder, maybe relative.
        ) {
            // We only do that for --all. Otherwise we have the installed version and the user specified
            // it on the command line.
            if (options.all) {
                logger.warn(`Package ${JSON.stringify(npmName)} has a custom version: `
                    + `${JSON.stringify(version)}. Skipping.`);
                continue;
            }
        }
        packages.set(npmName, (maybeVersion || (options.next ? 'next' : 'latest')));
    }
    return packages;
}
function _addPackageGroup(tree, packages, allDependencies, npmPackageJson, logger) {
    const maybePackage = packages.get(npmPackageJson.name);
    if (!maybePackage) {
        return;
    }
    const info = _buildPackageInfo(tree, packages, allDependencies, npmPackageJson, logger);
    const version = (info.target && info.target.version)
        || npmPackageJson['dist-tags'][maybePackage]
        || maybePackage;
    if (!npmPackageJson.versions[version]) {
        return;
    }
    const ngUpdateMetadata = npmPackageJson.versions[version]['ng-update'];
    if (!ngUpdateMetadata) {
        return;
    }
    const packageGroup = ngUpdateMetadata['packageGroup'];
    if (!packageGroup) {
        return;
    }
    if (!Array.isArray(packageGroup) || packageGroup.some(x => typeof x != 'string')) {
        logger.warn(`packageGroup metadata of package ${npmPackageJson.name} is malformed.`);
        return;
    }
    packageGroup
        .filter(name => !packages.has(name)) // Don't override names from the command line.
        .filter(name => allDependencies.has(name)) // Remove packages that aren't installed.
        .forEach(name => {
        packages.set(name, maybePackage);
    });
}
/**
 * Add peer dependencies of packages on the command line to the list of packages to update.
 * We don't do verification of the versions here as this will be done by a later step (and can
 * be ignored by the --force flag).
 * @private
 */
function _addPeerDependencies(tree, packages, allDependencies, npmPackageJson, logger) {
    const maybePackage = packages.get(npmPackageJson.name);
    if (!maybePackage) {
        return;
    }
    const info = _buildPackageInfo(tree, packages, allDependencies, npmPackageJson, logger);
    const version = (info.target && info.target.version)
        || npmPackageJson['dist-tags'][maybePackage]
        || maybePackage;
    if (!npmPackageJson.versions[version]) {
        return;
    }
    const packageJson = npmPackageJson.versions[version];
    const error = false;
    for (const [peer, range] of Object.entries(packageJson.peerDependencies || {})) {
        if (!packages.has(peer)) {
            packages.set(peer, range);
        }
    }
    if (error) {
        throw new schematics_1.SchematicsException('An error occured, see above.');
    }
}
function _getAllDependencies(tree) {
    const packageJsonContent = tree.read('/package.json');
    if (!packageJsonContent) {
        throw new schematics_1.SchematicsException('Could not find a package.json. Are you in a Node project?');
    }
    let packageJson;
    try {
        packageJson = JSON.parse(packageJsonContent.toString());
    }
    catch (e) {
        throw new schematics_1.SchematicsException('package.json could not be parsed: ' + e.message);
    }
    return new Map([
        ...Object.entries(packageJson.peerDependencies || {}),
        ...Object.entries(packageJson.devDependencies || {}),
        ...Object.entries(packageJson.dependencies || {}),
    ]);
}
function _formatVersion(version) {
    if (version === undefined) {
        return undefined;
    }
    if (!version.match(/^\d{1,30}\.\d{1,30}\.\d{1,30}/)) {
        version += '.0';
    }
    if (!version.match(/^\d{1,30}\.\d{1,30}\.\d{1,30}/)) {
        version += '.0';
    }
    if (!semver.valid(version)) {
        throw new schematics_1.SchematicsException(`Invalid migration version: ${JSON.stringify(version)}`);
    }
    return version;
}
function default_1(options) {
    if (!options.packages) {
        // We cannot just return this because we need to fetch the packages from NPM still for the
        // help/guide to show.
        options.packages = [];
    }
    else if (typeof options.packages == 'string') {
        // If a string, then we should split it and make it an array.
        options.packages = options.packages.split(/,/g);
    }
    if (options.migrateOnly && options.from) {
        if (options.packages.length !== 1) {
            throw new schematics_1.SchematicsException('--from requires that only a single package be passed.');
        }
    }
    options.from = _formatVersion(options.from);
    options.to = _formatVersion(options.to);
    return (tree, context) => {
        const logger = context.logger;
        const allDependencies = _getAllDependencies(tree);
        const packages = _buildPackageList(options, allDependencies, logger);
        return rxjs_1.from([...allDependencies.keys()]).pipe(
        // Grab all package.json from the npm repository. This requires a lot of HTTP calls so we
        // try to parallelize as many as possible.
        operators_1.mergeMap(depName => npm_1.getNpmPackageJson(depName, options.registry, logger)), 
        // Build a map of all dependencies and their packageJson.
        operators_1.reduce((acc, npmPackageJson) => {
            // If the package was not found on the registry. It could be private, so we will just
            // ignore. If the package was part of the list, we will error out, but will simply ignore
            // if it's either not requested (so just part of package.json. silently) or if it's a
            // `--all` situation. There is an edge case here where a public package peer depends on a
            // private one, but it's rare enough.
            if (!npmPackageJson.name) {
                if (packages.has(npmPackageJson.requestedName)) {
                    if (options.all) {
                        logger.warn(`Package ${JSON.stringify(npmPackageJson.requestedName)} was not `
                            + 'found on the registry. Skipping.');
                    }
                    else {
                        throw new schematics_1.SchematicsException(`Package ${JSON.stringify(npmPackageJson.requestedName)} was not found on the `
                            + 'registry. Cannot continue as this may be an error.');
                    }
                }
            }
            else {
                acc.set(npmPackageJson.name, npmPackageJson);
            }
            return acc;
        }, new Map()), operators_1.map(npmPackageJsonMap => {
            // Augment the command line package list with packageGroups and forward peer dependencies.
            // Each added package may uncover new package groups and peer dependencies, so we must
            // repeat this process until the package list stabilizes.
            let lastPackagesSize;
            do {
                lastPackagesSize = packages.size;
                npmPackageJsonMap.forEach((npmPackageJson) => {
                    _addPackageGroup(tree, packages, allDependencies, npmPackageJson, logger);
                    _addPeerDependencies(tree, packages, allDependencies, npmPackageJson, logger);
                });
            } while (packages.size > lastPackagesSize);
            // Build the PackageInfo for each module.
            const packageInfoMap = new Map();
            npmPackageJsonMap.forEach((npmPackageJson) => {
                packageInfoMap.set(npmPackageJson.name, _buildPackageInfo(tree, packages, allDependencies, npmPackageJson, logger));
            });
            return packageInfoMap;
        }), operators_1.switchMap(infoMap => {
            // Now that we have all the information, check the flags.
            if (packages.size > 0) {
                if (options.migrateOnly && options.from && options.packages) {
                    return _migrateOnly(infoMap.get(options.packages[0]), context, options.from, options.to);
                }
                const sublog = new core_1.logging.LevelCapLogger('validation', logger.createChild(''), 'warn');
                _validateUpdatePackages(infoMap, options.force, sublog);
                return _performUpdate(tree, context, infoMap, logger, options.migrateOnly);
            }
            else {
                return _usageMessage(options, infoMap, logger);
            }
        }), operators_1.switchMap(() => rxjs_1.of(tree)));
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL3NjaGVtYXRpY3MvdXBkYXRlL3VwZGF0ZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQUErQztBQUMvQywyREFNb0M7QUFDcEMsNERBQTRGO0FBQzVGLCtCQUE4RDtBQUM5RCw4Q0FBa0U7QUFDbEUsaUNBQWlDO0FBQ2pDLCtCQUEwQztBQVMxQyxrR0FBa0c7QUFDbEcsK0ZBQStGO0FBQy9GLDhGQUE4RjtBQUM5Rix3RkFBd0Y7QUFDeEYscUNBQXFDO0FBQ3JDLHFDQUE0QyxLQUFhO0lBQ3ZELEtBQUssR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2pDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNkLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUMxQyxLQUFLLEVBQUUsQ0FBQztRQUNSLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hCLHNEQUFzRDtZQUN0RCxpREFBaUQ7WUFDakQsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUNmLENBQUM7SUFDSCxDQUFDO0lBRUQsNEZBQTRGO0lBQzVGLGdHQUFnRztJQUNoRywwRkFBMEY7SUFDMUYsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLEdBQUcsQ0FBQyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUM7UUFDeEMsUUFBUSxJQUFJLFFBQVEsS0FBSyxJQUFJLEtBQUssYUFBYSxDQUFDO0lBQ2xELENBQUM7SUFFRCxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLENBQUM7QUFDOUMsQ0FB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TUFBTSxDQUNQLENBQUM7Z0JBQ0YsdUJBQXVCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRXhELE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM3RSxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sTUFBTSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2pELENBQUM7UUFDSCxDQUFDLENBQUMsRUFFRixxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUMxQixDQUFDO0lBQ0osQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQTlHRCw0QkE4R0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBsb2dnaW5nIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtcbiAgUnVsZSxcbiAgU2NoZW1hdGljQ29udGV4dCxcbiAgU2NoZW1hdGljc0V4Y2VwdGlvbixcbiAgVGFza0lkLFxuICBUcmVlLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgeyBOb2RlUGFja2FnZUluc3RhbGxUYXNrLCBSdW5TY2hlbWF0aWNUYXNrIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgZnJvbSBhcyBvYnNlcnZhYmxlRnJvbSwgb2YgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IG1hcCwgbWVyZ2VNYXAsIHJlZHVjZSwgc3dpdGNoTWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgeyBnZXROcG1QYWNrYWdlSnNvbiB9IGZyb20gJy4vbnBtJztcbmltcG9ydCB7IE5wbVJlcG9zaXRvcnlQYWNrYWdlSnNvbiB9IGZyb20gJy4vbnBtLXBhY2thZ2UtanNvbic7XG5pbXBvcnQgeyBEZXBlbmRlbmN5LCBKc29uU2NoZW1hRm9yTnBtUGFja2FnZUpzb25GaWxlcyB9IGZyb20gJy4vcGFja2FnZS1qc29uJztcbmltcG9ydCB7IFVwZGF0ZVNjaGVtYSB9IGZyb20gJy4vc2NoZW1hJztcblxudHlwZSBWZXJzaW9uUmFuZ2UgPSBzdHJpbmcgJiB7IF9fVkVSU0lPTl9SQU5HRTogdm9pZDsgfTtcbnR5cGUgUGVlclZlcnNpb25UcmFuc2Zvcm0gPSBzdHJpbmcgfCAoKHJhbmdlOiBzdHJpbmcpID0+IHN0cmluZyk7XG5cblxuLy8gQW5ndWxhciBndWFyYW50ZWVzIHRoYXQgYSBtYWpvciBpcyBjb21wYXRpYmxlIHdpdGggaXRzIGZvbGxvd2luZyBtYWpvciAoc28gcGFja2FnZXMgdGhhdCBkZXBlbmRcbi8vIG9uIEFuZ3VsYXIgNSBhcmUgYWxzbyBjb21wYXRpYmxlIHdpdGggQW5ndWxhciA2KS4gVGhpcyBpcywgaW4gY29kZSwgcmVwcmVzZW50ZWQgYnkgdmVyaWZ5aW5nXG4vLyB0aGF0IGFsbCBvdGhlciBwYWNrYWdlcyB0aGF0IGhhdmUgYSBwZWVyIGRlcGVuZGVuY3kgb2YgYFwiQGFuZ3VsYXIvY29yZVwiOiBcIl41LjAuMFwiYCBhY3R1YWxseVxuLy8gc3VwcG9ydHMgNi4wLCBieSBhZGRpbmcgdGhhdCBjb21wYXRpYmlsaXR5IHRvIHRoZSByYW5nZSwgc28gaXQgaXMgYF41LjAuMCB8fCBeNi4wLjBgLlxuLy8gV2UgZXhwb3J0IGl0IHRvIGFsbG93IGZvciB0ZXN0aW5nLlxuZXhwb3J0IGZ1bmN0aW9uIGFuZ3VsYXJNYWpvckNvbXBhdEd1YXJhbnRlZShyYW5nZTogc3RyaW5nKSB7XG4gIHJhbmdlID0gc2VtdmVyLnZhbGlkUmFuZ2UocmFuZ2UpO1xuICBsZXQgbWFqb3IgPSAxO1xuICB3aGlsZSAoIXNlbXZlci5ndHIobWFqb3IgKyAnLjAuMCcsIHJhbmdlKSkge1xuICAgIG1ham9yKys7XG4gICAgaWYgKG1ham9yID49IDk5KSB7XG4gICAgICAvLyBVc2Ugb3JpZ2luYWwgcmFuZ2UgaWYgaXQgc3VwcG9ydHMgYSBtYWpvciB0aGlzIGhpZ2hcbiAgICAgIC8vIFJhbmdlIGlzIG1vc3QgbGlrZWx5IHVuYm91bmRlZCAoZS5nLiwgPj01LjAuMClcbiAgICAgIHJldHVybiByYW5nZTtcbiAgICB9XG4gIH1cblxuICAvLyBBZGQgdGhlIG1ham9yIHZlcnNpb24gYXMgY29tcGF0aWJsZSB3aXRoIHRoZSBhbmd1bGFyIGNvbXBhdGlibGUsIHdpdGggYWxsIG1pbm9ycy4gVGhpcyBpc1xuICAvLyBhbHJlYWR5IG9uZSBtYWpvciBhYm92ZSB0aGUgZ3JlYXRlc3Qgc3VwcG9ydGVkLCBiZWNhdXNlIHdlIGluY3JlbWVudCBgbWFqb3JgIGJlZm9yZSBjaGVja2luZy5cbiAgLy8gV2UgYWRkIG1pbm9ycyBsaWtlIHRoaXMgYmVjYXVzZSBhIG1pbm9yIGJldGEgaXMgc3RpbGwgY29tcGF0aWJsZSB3aXRoIGEgbWlub3Igbm9uLWJldGEuXG4gIGxldCBuZXdSYW5nZSA9IHJhbmdlO1xuICBmb3IgKGxldCBtaW5vciA9IDA7IG1pbm9yIDwgMjA7IG1pbm9yKyspIHtcbiAgICBuZXdSYW5nZSArPSBgIHx8IF4ke21ham9yfS4ke21pbm9yfS4wLWFscGhhLjAgYDtcbiAgfVxuXG4gIHJldHVybiBzZW12ZXIudmFsaWRSYW5nZShuZXdSYW5nZSkgfHwgcmFuZ2U7XG59XG5cblxuLy8gVGhpcyBpcyBhIG1hcCBvZiBwYWNrYWdlR3JvdXBOYW1lIHRvIHJhbmdlIGV4dGVuZGluZyBmdW5jdGlvbi4gSWYgaXQgaXNuJ3QgZm91bmQsIHRoZSByYW5nZSBpc1xuLy8ga2VwdCB0aGUgc2FtZS5cbmNvbnN0IHBlZXJDb21wYXRpYmxlV2hpdGVsaXN0OiB7IFtuYW1lOiBzdHJpbmddOiBQZWVyVmVyc2lvblRyYW5zZm9ybSB9ID0ge1xuICAnQGFuZ3VsYXIvY29yZSc6IGFuZ3VsYXJNYWpvckNvbXBhdEd1YXJhbnRlZSxcbn07XG5cbmludGVyZmFjZSBQYWNrYWdlVmVyc2lvbkluZm8ge1xuICB2ZXJzaW9uOiBWZXJzaW9uUmFuZ2U7XG4gIHBhY2thZ2VKc29uOiBKc29uU2NoZW1hRm9yTnBtUGFja2FnZUpzb25GaWxlcztcbiAgdXBkYXRlTWV0YWRhdGE6IFVwZGF0ZU1ldGFkYXRhO1xufVxuXG5pbnRlcmZhY2UgUGFja2FnZUluZm8ge1xuICBuYW1lOiBzdHJpbmc7XG4gIG5wbVBhY2thZ2VKc29uOiBOcG1SZXBvc2l0b3J5UGFja2FnZUpzb247XG4gIGluc3RhbGxlZDogUGFja2FnZVZlcnNpb25JbmZvO1xuICB0YXJnZXQ/OiBQYWNrYWdlVmVyc2lvbkluZm87XG4gIHBhY2thZ2VKc29uUmFuZ2U6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFVwZGF0ZU1ldGFkYXRhIHtcbiAgcGFja2FnZUdyb3VwOiBzdHJpbmdbXTtcbiAgcmVxdWlyZW1lbnRzOiB7IFtwYWNrYWdlTmFtZTogc3RyaW5nXTogc3RyaW5nIH07XG4gIG1pZ3JhdGlvbnM/OiBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIF91cGRhdGVQZWVyVmVyc2lvbihpbmZvTWFwOiBNYXA8c3RyaW5nLCBQYWNrYWdlSW5mbz4sIG5hbWU6IHN0cmluZywgcmFuZ2U6IHN0cmluZykge1xuICAvLyBSZXNvbHZlIHBhY2thZ2VHcm91cE5hbWUuXG4gIGNvbnN0IG1heWJlUGFja2FnZUluZm8gPSBpbmZvTWFwLmdldChuYW1lKTtcbiAgaWYgKCFtYXliZVBhY2thZ2VJbmZvKSB7XG4gICAgcmV0dXJuIHJhbmdlO1xuICB9XG4gIGlmIChtYXliZVBhY2thZ2VJbmZvLnRhcmdldCkge1xuICAgIG5hbWUgPSBtYXliZVBhY2thZ2VJbmZvLnRhcmdldC51cGRhdGVNZXRhZGF0YS5wYWNrYWdlR3JvdXBbMF0gfHwgbmFtZTtcbiAgfSBlbHNlIHtcbiAgICBuYW1lID0gbWF5YmVQYWNrYWdlSW5mby5pbnN0YWxsZWQudXBkYXRlTWV0YWRhdGEucGFja2FnZUdyb3VwWzBdIHx8IG5hbWU7XG4gIH1cblxuICBjb25zdCBtYXliZVRyYW5zZm9ybSA9IHBlZXJDb21wYXRpYmxlV2hpdGVsaXN0W25hbWVdO1xuICBpZiAobWF5YmVUcmFuc2Zvcm0pIHtcbiAgICBpZiAodHlwZW9mIG1heWJlVHJhbnNmb3JtID09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBtYXliZVRyYW5zZm9ybShyYW5nZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBtYXliZVRyYW5zZm9ybTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmFuZ2U7XG59XG5cbmZ1bmN0aW9uIF92YWxpZGF0ZUZvcndhcmRQZWVyRGVwZW5kZW5jaWVzKFxuICBuYW1lOiBzdHJpbmcsXG4gIGluZm9NYXA6IE1hcDxzdHJpbmcsIFBhY2thZ2VJbmZvPixcbiAgcGVlcnM6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfSxcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbik6IGJvb2xlYW4ge1xuICBmb3IgKGNvbnN0IFtwZWVyLCByYW5nZV0gb2YgT2JqZWN0LmVudHJpZXMocGVlcnMpKSB7XG4gICAgbG9nZ2VyLmRlYnVnKGBDaGVja2luZyBmb3J3YXJkIHBlZXIgJHtwZWVyfS4uLmApO1xuICAgIGNvbnN0IG1heWJlUGVlckluZm8gPSBpbmZvTWFwLmdldChwZWVyKTtcbiAgICBpZiAoIW1heWJlUGVlckluZm8pIHtcbiAgICAgIGxvZ2dlci5lcnJvcihbXG4gICAgICAgIGBQYWNrYWdlICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IGhhcyBhIG1pc3NpbmcgcGVlciBkZXBlbmRlbmN5IG9mYCxcbiAgICAgICAgYCR7SlNPTi5zdHJpbmdpZnkocGVlcil9IEAgJHtKU09OLnN0cmluZ2lmeShyYW5nZSl9LmAsXG4gICAgICBdLmpvaW4oJyAnKSk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHBlZXJWZXJzaW9uID0gbWF5YmVQZWVySW5mby50YXJnZXQgJiYgbWF5YmVQZWVySW5mby50YXJnZXQucGFja2FnZUpzb24udmVyc2lvblxuICAgICAgPyBtYXliZVBlZXJJbmZvLnRhcmdldC5wYWNrYWdlSnNvbi52ZXJzaW9uXG4gICAgICA6IG1heWJlUGVlckluZm8uaW5zdGFsbGVkLnZlcnNpb247XG5cbiAgICBsb2dnZXIuZGVidWcoYCAgUmFuZ2UgaW50ZXJzZWN0cygke3JhbmdlfSwgJHtwZWVyVmVyc2lvbn0pLi4uYCk7XG4gICAgaWYgKCFzZW12ZXIuc2F0aXNmaWVzKHBlZXJWZXJzaW9uLCByYW5nZSkpIHtcbiAgICAgIGxvZ2dlci5lcnJvcihbXG4gICAgICAgIGBQYWNrYWdlICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IGhhcyBhbiBpbmNvbXBhdGlibGUgcGVlciBkZXBlbmRlbmN5IHRvYCxcbiAgICAgICAgYCR7SlNPTi5zdHJpbmdpZnkocGVlcil9IChyZXF1aXJlcyAke0pTT04uc3RyaW5naWZ5KHJhbmdlKX0sYCxcbiAgICAgICAgYHdvdWxkIGluc3RhbGwgJHtKU09OLnN0cmluZ2lmeShwZWVyVmVyc2lvbil9KWAsXG4gICAgICBdLmpvaW4oJyAnKSk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuXG5mdW5jdGlvbiBfdmFsaWRhdGVSZXZlcnNlUGVlckRlcGVuZGVuY2llcyhcbiAgbmFtZTogc3RyaW5nLFxuICB2ZXJzaW9uOiBzdHJpbmcsXG4gIGluZm9NYXA6IE1hcDxzdHJpbmcsIFBhY2thZ2VJbmZvPixcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbikge1xuICBmb3IgKGNvbnN0IFtpbnN0YWxsZWQsIGluc3RhbGxlZEluZm9dIG9mIGluZm9NYXAuZW50cmllcygpKSB7XG4gICAgY29uc3QgaW5zdGFsbGVkTG9nZ2VyID0gbG9nZ2VyLmNyZWF0ZUNoaWxkKGluc3RhbGxlZCk7XG4gICAgaW5zdGFsbGVkTG9nZ2VyLmRlYnVnKGAke2luc3RhbGxlZH0uLi5gKTtcbiAgICBjb25zdCBwZWVycyA9IChpbnN0YWxsZWRJbmZvLnRhcmdldCB8fCBpbnN0YWxsZWRJbmZvLmluc3RhbGxlZCkucGFja2FnZUpzb24ucGVlckRlcGVuZGVuY2llcztcblxuICAgIGZvciAoY29uc3QgW3BlZXIsIHJhbmdlXSBvZiBPYmplY3QuZW50cmllcyhwZWVycyB8fCB7fSkpIHtcbiAgICAgIGlmIChwZWVyICE9IG5hbWUpIHtcbiAgICAgICAgLy8gT25seSBjaGVjayBwZWVycyB0byB0aGUgcGFja2FnZXMgd2UncmUgdXBkYXRpbmcuIFdlIGRvbid0IGNhcmUgYWJvdXQgcGVlcnNcbiAgICAgICAgLy8gdGhhdCBhcmUgdW5tZXQgYnV0IHdlIGhhdmUgbm8gZWZmZWN0IG9uLlxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gT3ZlcnJpZGUgdGhlIHBlZXIgdmVyc2lvbiByYW5nZSBpZiBpdCdzIHdoaXRlbGlzdGVkLlxuICAgICAgY29uc3QgZXh0ZW5kZWRSYW5nZSA9IF91cGRhdGVQZWVyVmVyc2lvbihpbmZvTWFwLCBwZWVyLCByYW5nZSk7XG5cbiAgICAgIGlmICghc2VtdmVyLnNhdGlzZmllcyh2ZXJzaW9uLCBleHRlbmRlZFJhbmdlKSkge1xuICAgICAgICBsb2dnZXIuZXJyb3IoW1xuICAgICAgICAgIGBQYWNrYWdlICR7SlNPTi5zdHJpbmdpZnkoaW5zdGFsbGVkKX0gaGFzIGFuIGluY29tcGF0aWJsZSBwZWVyIGRlcGVuZGVuY3kgdG9gLFxuICAgICAgICAgIGAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSAocmVxdWlyZXNgLFxuICAgICAgICAgIGAke0pTT04uc3RyaW5naWZ5KHJhbmdlKX0ke2V4dGVuZGVkUmFuZ2UgPT0gcmFuZ2UgPyAnJyA6ICcgKGV4dGVuZGVkKSd9LGAsXG4gICAgICAgICAgYHdvdWxkIGluc3RhbGwgJHtKU09OLnN0cmluZ2lmeSh2ZXJzaW9uKX0pLmAsXG4gICAgICAgIF0uam9pbignICcpKTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIF92YWxpZGF0ZVVwZGF0ZVBhY2thZ2VzKFxuICBpbmZvTWFwOiBNYXA8c3RyaW5nLCBQYWNrYWdlSW5mbz4sXG4gIGZvcmNlOiBib29sZWFuLFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuKTogdm9pZCB7XG4gIGxvZ2dlci5kZWJ1ZygnVXBkYXRpbmcgdGhlIGZvbGxvd2luZyBwYWNrYWdlczonKTtcbiAgaW5mb01hcC5mb3JFYWNoKGluZm8gPT4ge1xuICAgIGlmIChpbmZvLnRhcmdldCkge1xuICAgICAgbG9nZ2VyLmRlYnVnKGAgICR7aW5mby5uYW1lfSA9PiAke2luZm8udGFyZ2V0LnZlcnNpb259YCk7XG4gICAgfVxuICB9KTtcblxuICBsZXQgcGVlckVycm9ycyA9IGZhbHNlO1xuICBpbmZvTWFwLmZvckVhY2goaW5mbyA9PiB7XG4gICAgY29uc3Qge25hbWUsIHRhcmdldH0gPSBpbmZvO1xuICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcGtnTG9nZ2VyID0gbG9nZ2VyLmNyZWF0ZUNoaWxkKG5hbWUpO1xuICAgIGxvZ2dlci5kZWJ1ZyhgJHtuYW1lfS4uLmApO1xuXG4gICAgY29uc3QgcGVlcnMgPSB0YXJnZXQucGFja2FnZUpzb24ucGVlckRlcGVuZGVuY2llcyB8fCB7fTtcbiAgICBwZWVyRXJyb3JzID0gX3ZhbGlkYXRlRm9yd2FyZFBlZXJEZXBlbmRlbmNpZXMobmFtZSwgaW5mb01hcCwgcGVlcnMsIHBrZ0xvZ2dlcikgfHwgcGVlckVycm9ycztcbiAgICBwZWVyRXJyb3JzXG4gICAgICA9IF92YWxpZGF0ZVJldmVyc2VQZWVyRGVwZW5kZW5jaWVzKG5hbWUsIHRhcmdldC52ZXJzaW9uLCBpbmZvTWFwLCBwa2dMb2dnZXIpXG4gICAgICB8fCBwZWVyRXJyb3JzO1xuICB9KTtcblxuICBpZiAoIWZvcmNlICYmIHBlZXJFcnJvcnMpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgSW5jb21wYXRpYmxlIHBlZXIgZGVwZW5kZW5jaWVzIGZvdW5kLiBTZWUgYWJvdmUuYCk7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBfcGVyZm9ybVVwZGF0ZShcbiAgdHJlZTogVHJlZSxcbiAgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCxcbiAgaW5mb01hcDogTWFwPHN0cmluZywgUGFja2FnZUluZm8+LFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuICBtaWdyYXRlT25seTogYm9vbGVhbixcbik6IE9ic2VydmFibGU8dm9pZD4ge1xuICBjb25zdCBwYWNrYWdlSnNvbkNvbnRlbnQgPSB0cmVlLnJlYWQoJy9wYWNrYWdlLmpzb24nKTtcbiAgaWYgKCFwYWNrYWdlSnNvbkNvbnRlbnQpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignQ291bGQgbm90IGZpbmQgYSBwYWNrYWdlLmpzb24uIEFyZSB5b3UgaW4gYSBOb2RlIHByb2plY3Q/Jyk7XG4gIH1cblxuICBsZXQgcGFja2FnZUpzb246IEpzb25TY2hlbWFGb3JOcG1QYWNrYWdlSnNvbkZpbGVzO1xuICB0cnkge1xuICAgIHBhY2thZ2VKc29uID0gSlNPTi5wYXJzZShwYWNrYWdlSnNvbkNvbnRlbnQudG9TdHJpbmcoKSkgYXMgSnNvblNjaGVtYUZvck5wbVBhY2thZ2VKc29uRmlsZXM7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbigncGFja2FnZS5qc29uIGNvdWxkIG5vdCBiZSBwYXJzZWQ6ICcgKyBlLm1lc3NhZ2UpO1xuICB9XG5cbiAgY29uc3QgdXBkYXRlRGVwZW5kZW5jeSA9IChkZXBzOiBEZXBlbmRlbmN5LCBuYW1lOiBzdHJpbmcsIG5ld1ZlcnNpb246IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IG9sZFZlcnNpb24gPSBkZXBzW25hbWVdO1xuICAgIC8vIFdlIG9ubHkgcmVzcGVjdCBjYXJldCBhbmQgdGlsZGUgcmFuZ2VzIG9uIHVwZGF0ZS5cbiAgICBjb25zdCBleGVjUmVzdWx0ID0gL15bXFxefl0vLmV4ZWMob2xkVmVyc2lvbik7XG4gICAgZGVwc1tuYW1lXSA9IGAke2V4ZWNSZXN1bHQgPyBleGVjUmVzdWx0WzBdIDogJyd9JHtuZXdWZXJzaW9ufWA7XG4gIH07XG5cbiAgY29uc3QgdG9JbnN0YWxsID0gWy4uLmluZm9NYXAudmFsdWVzKCldXG4gICAgICAubWFwKHggPT4gW3gubmFtZSwgeC50YXJnZXQsIHguaW5zdGFsbGVkXSlcbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpub24tbnVsbC1vcGVyYXRvclxuICAgICAgLmZpbHRlcigoW25hbWUsIHRhcmdldCwgaW5zdGFsbGVkXSkgPT4ge1xuICAgICAgICByZXR1cm4gISFuYW1lICYmICEhdGFyZ2V0ICYmICEhaW5zdGFsbGVkO1xuICAgICAgfSkgYXMgW3N0cmluZywgUGFja2FnZVZlcnNpb25JbmZvLCBQYWNrYWdlVmVyc2lvbkluZm9dW107XG5cbiAgdG9JbnN0YWxsLmZvckVhY2goKFtuYW1lLCB0YXJnZXQsIGluc3RhbGxlZF0pID0+IHtcbiAgICBsb2dnZXIuaW5mbyhcbiAgICAgIGBVcGRhdGluZyBwYWNrYWdlLmpzb24gd2l0aCBkZXBlbmRlbmN5ICR7bmFtZX0gYFxuICAgICAgKyBgQCAke0pTT04uc3RyaW5naWZ5KHRhcmdldC52ZXJzaW9uKX0gKHdhcyAke0pTT04uc3RyaW5naWZ5KGluc3RhbGxlZC52ZXJzaW9uKX0pLi4uYCxcbiAgICApO1xuXG4gICAgaWYgKHBhY2thZ2VKc29uLmRlcGVuZGVuY2llcyAmJiBwYWNrYWdlSnNvbi5kZXBlbmRlbmNpZXNbbmFtZV0pIHtcbiAgICAgIHVwZGF0ZURlcGVuZGVuY3kocGFja2FnZUpzb24uZGVwZW5kZW5jaWVzLCBuYW1lLCB0YXJnZXQudmVyc2lvbik7XG5cbiAgICAgIGlmIChwYWNrYWdlSnNvbi5kZXZEZXBlbmRlbmNpZXMgJiYgcGFja2FnZUpzb24uZGV2RGVwZW5kZW5jaWVzW25hbWVdKSB7XG4gICAgICAgIGRlbGV0ZSBwYWNrYWdlSnNvbi5kZXZEZXBlbmRlbmNpZXNbbmFtZV07XG4gICAgICB9XG4gICAgICBpZiAocGFja2FnZUpzb24ucGVlckRlcGVuZGVuY2llcyAmJiBwYWNrYWdlSnNvbi5wZWVyRGVwZW5kZW5jaWVzW25hbWVdKSB7XG4gICAgICAgIGRlbGV0ZSBwYWNrYWdlSnNvbi5wZWVyRGVwZW5kZW5jaWVzW25hbWVdO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocGFja2FnZUpzb24uZGV2RGVwZW5kZW5jaWVzICYmIHBhY2thZ2VKc29uLmRldkRlcGVuZGVuY2llc1tuYW1lXSkge1xuICAgICAgdXBkYXRlRGVwZW5kZW5jeShwYWNrYWdlSnNvbi5kZXZEZXBlbmRlbmNpZXMsIG5hbWUsIHRhcmdldC52ZXJzaW9uKTtcblxuICAgICAgaWYgKHBhY2thZ2VKc29uLnBlZXJEZXBlbmRlbmNpZXMgJiYgcGFja2FnZUpzb24ucGVlckRlcGVuZGVuY2llc1tuYW1lXSkge1xuICAgICAgICBkZWxldGUgcGFja2FnZUpzb24ucGVlckRlcGVuZGVuY2llc1tuYW1lXTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHBhY2thZ2VKc29uLnBlZXJEZXBlbmRlbmNpZXMgJiYgcGFja2FnZUpzb24ucGVlckRlcGVuZGVuY2llc1tuYW1lXSkge1xuICAgICAgdXBkYXRlRGVwZW5kZW5jeShwYWNrYWdlSnNvbi5wZWVyRGVwZW5kZW5jaWVzLCBuYW1lLCB0YXJnZXQudmVyc2lvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvZ2dlci53YXJuKGBQYWNrYWdlICR7bmFtZX0gd2FzIG5vdCBmb3VuZCBpbiBkZXBlbmRlbmNpZXMuYCk7XG4gICAgfVxuICB9KTtcblxuICBjb25zdCBuZXdDb250ZW50ID0gSlNPTi5zdHJpbmdpZnkocGFja2FnZUpzb24sIG51bGwsIDIpO1xuICBpZiAocGFja2FnZUpzb25Db250ZW50LnRvU3RyaW5nKCkgIT0gbmV3Q29udGVudCB8fCBtaWdyYXRlT25seSkge1xuICAgIGxldCBpbnN0YWxsVGFzazogVGFza0lkW10gPSBbXTtcbiAgICBpZiAoIW1pZ3JhdGVPbmx5KSB7XG4gICAgICAvLyBJZiBzb21ldGhpbmcgY2hhbmdlZCwgYWxzbyBob29rIHVwIHRoZSB0YXNrLlxuICAgICAgdHJlZS5vdmVyd3JpdGUoJy9wYWNrYWdlLmpzb24nLCBKU09OLnN0cmluZ2lmeShwYWNrYWdlSnNvbiwgbnVsbCwgMikpO1xuICAgICAgaW5zdGFsbFRhc2sgPSBbY29udGV4dC5hZGRUYXNrKG5ldyBOb2RlUGFja2FnZUluc3RhbGxUYXNrKCkpXTtcbiAgICB9XG5cbiAgICAvLyBSdW4gdGhlIG1pZ3JhdGUgc2NoZW1hdGljcyB3aXRoIHRoZSBsaXN0IG9mIHBhY2thZ2VzIHRvIHVzZS4gVGhlIGNvbGxlY3Rpb24gY29udGFpbnNcbiAgICAvLyB2ZXJzaW9uIGluZm9ybWF0aW9uIGFuZCB3ZSBuZWVkIHRvIGRvIHRoaXMgcG9zdCBpbnN0YWxsYXRpb24uIFBsZWFzZSBub3RlIHRoYXQgdGhlXG4gICAgLy8gbWlncmF0aW9uIENPVUxEIGZhaWwgYW5kIGxlYXZlIHNpZGUgZWZmZWN0cyBvbiBkaXNrLlxuICAgIC8vIFJ1biB0aGUgc2NoZW1hdGljcyB0YXNrIG9mIHRob3NlIHBhY2thZ2VzLlxuICAgIHRvSW5zdGFsbC5mb3JFYWNoKChbbmFtZSwgdGFyZ2V0LCBpbnN0YWxsZWRdKSA9PiB7XG4gICAgICBpZiAoIXRhcmdldC51cGRhdGVNZXRhZGF0YS5taWdyYXRpb25zKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY29sbGVjdGlvbiA9IChcbiAgICAgICAgdGFyZ2V0LnVwZGF0ZU1ldGFkYXRhLm1pZ3JhdGlvbnMubWF0Y2goL15bLi9dLylcbiAgICAgICAgPyBuYW1lICsgJy8nXG4gICAgICAgIDogJydcbiAgICAgICkgKyB0YXJnZXQudXBkYXRlTWV0YWRhdGEubWlncmF0aW9ucztcblxuICAgICAgY29udGV4dC5hZGRUYXNrKG5ldyBSdW5TY2hlbWF0aWNUYXNrKCdAc2NoZW1hdGljcy91cGRhdGUnLCAnbWlncmF0ZScsIHtcbiAgICAgICAgICBwYWNrYWdlOiBuYW1lLFxuICAgICAgICAgIGNvbGxlY3Rpb24sXG4gICAgICAgICAgZnJvbTogaW5zdGFsbGVkLnZlcnNpb24sXG4gICAgICAgICAgdG86IHRhcmdldC52ZXJzaW9uLFxuICAgICAgICB9KSxcbiAgICAgICAgaW5zdGFsbFRhc2ssXG4gICAgICApO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIG9mPHZvaWQ+KHVuZGVmaW5lZCk7XG59XG5cbmZ1bmN0aW9uIF9taWdyYXRlT25seShcbiAgaW5mbzogUGFja2FnZUluZm8gfCB1bmRlZmluZWQsXG4gIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQsXG4gIGZyb206IHN0cmluZyxcbiAgdG8/OiBzdHJpbmcsXG4pIHtcbiAgaWYgKCFpbmZvKSB7XG4gICAgcmV0dXJuIG9mPHZvaWQ+KCk7XG4gIH1cblxuICBjb25zdCB0YXJnZXQgPSBpbmZvLmluc3RhbGxlZDtcbiAgaWYgKCF0YXJnZXQgfHwgIXRhcmdldC51cGRhdGVNZXRhZGF0YS5taWdyYXRpb25zKSB7XG4gICAgcmV0dXJuIG9mPHZvaWQ+KHVuZGVmaW5lZCk7XG4gIH1cblxuICBjb25zdCBjb2xsZWN0aW9uID0gKFxuICAgIHRhcmdldC51cGRhdGVNZXRhZGF0YS5taWdyYXRpb25zLm1hdGNoKC9eWy4vXS8pXG4gICAgICA/IGluZm8ubmFtZSArICcvJ1xuICAgICAgOiAnJ1xuICApICsgdGFyZ2V0LnVwZGF0ZU1ldGFkYXRhLm1pZ3JhdGlvbnM7XG5cbiAgY29udGV4dC5hZGRUYXNrKG5ldyBSdW5TY2hlbWF0aWNUYXNrKCdAc2NoZW1hdGljcy91cGRhdGUnLCAnbWlncmF0ZScsIHtcbiAgICAgIHBhY2thZ2U6IGluZm8ubmFtZSxcbiAgICAgIGNvbGxlY3Rpb24sXG4gICAgICBmcm9tOiBmcm9tLFxuICAgICAgdG86IHRvIHx8IHRhcmdldC52ZXJzaW9uLFxuICAgIH0pLFxuICApO1xuXG4gIHJldHVybiBvZjx2b2lkPih1bmRlZmluZWQpO1xufVxuXG5mdW5jdGlvbiBfZ2V0VXBkYXRlTWV0YWRhdGEoXG4gIHBhY2thZ2VKc29uOiBKc29uU2NoZW1hRm9yTnBtUGFja2FnZUpzb25GaWxlcyxcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbik6IFVwZGF0ZU1ldGFkYXRhIHtcbiAgY29uc3QgbWV0YWRhdGEgPSBwYWNrYWdlSnNvblsnbmctdXBkYXRlJ107XG5cbiAgY29uc3QgcmVzdWx0OiBVcGRhdGVNZXRhZGF0YSA9IHtcbiAgICBwYWNrYWdlR3JvdXA6IFtdLFxuICAgIHJlcXVpcmVtZW50czoge30sXG4gIH07XG5cbiAgaWYgKCFtZXRhZGF0YSB8fCB0eXBlb2YgbWV0YWRhdGEgIT0gJ29iamVjdCcgfHwgQXJyYXkuaXNBcnJheShtZXRhZGF0YSkpIHtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgaWYgKG1ldGFkYXRhWydwYWNrYWdlR3JvdXAnXSkge1xuICAgIGNvbnN0IHBhY2thZ2VHcm91cCA9IG1ldGFkYXRhWydwYWNrYWdlR3JvdXAnXTtcbiAgICAvLyBWZXJpZnkgdGhhdCBwYWNrYWdlR3JvdXAgaXMgYW4gYXJyYXkgb2Ygc3RyaW5ncy4gVGhpcyBpcyBub3QgYW4gZXJyb3IgYnV0IHdlIHN0aWxsIHdhcm5cbiAgICAvLyB0aGUgdXNlciBhbmQgaWdub3JlIHRoZSBwYWNrYWdlR3JvdXAga2V5cy5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocGFja2FnZUdyb3VwKSB8fCBwYWNrYWdlR3JvdXAuc29tZSh4ID0+IHR5cGVvZiB4ICE9ICdzdHJpbmcnKSkge1xuICAgICAgbG9nZ2VyLndhcm4oXG4gICAgICAgIGBwYWNrYWdlR3JvdXAgbWV0YWRhdGEgb2YgcGFja2FnZSAke3BhY2thZ2VKc29uLm5hbWV9IGlzIG1hbGZvcm1lZC4gSWdub3JpbmcuYCxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5wYWNrYWdlR3JvdXAgPSBwYWNrYWdlR3JvdXA7XG4gICAgfVxuICB9XG5cbiAgaWYgKG1ldGFkYXRhWydyZXF1aXJlbWVudHMnXSkge1xuICAgIGNvbnN0IHJlcXVpcmVtZW50cyA9IG1ldGFkYXRhWydyZXF1aXJlbWVudHMnXTtcbiAgICAvLyBWZXJpZnkgdGhhdCByZXF1aXJlbWVudHMgYXJlXG4gICAgaWYgKHR5cGVvZiByZXF1aXJlbWVudHMgIT0gJ29iamVjdCdcbiAgICAgICAgfHwgQXJyYXkuaXNBcnJheShyZXF1aXJlbWVudHMpXG4gICAgICAgIHx8IE9iamVjdC5rZXlzKHJlcXVpcmVtZW50cykuc29tZShuYW1lID0+IHR5cGVvZiByZXF1aXJlbWVudHNbbmFtZV0gIT0gJ3N0cmluZycpKSB7XG4gICAgICBsb2dnZXIud2FybihcbiAgICAgICAgYHJlcXVpcmVtZW50cyBtZXRhZGF0YSBvZiBwYWNrYWdlICR7cGFja2FnZUpzb24ubmFtZX0gaXMgbWFsZm9ybWVkLiBJZ25vcmluZy5gLFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0LnJlcXVpcmVtZW50cyA9IHJlcXVpcmVtZW50cztcbiAgICB9XG4gIH1cblxuICBpZiAobWV0YWRhdGFbJ21pZ3JhdGlvbnMnXSkge1xuICAgIGNvbnN0IG1pZ3JhdGlvbnMgPSBtZXRhZGF0YVsnbWlncmF0aW9ucyddO1xuICAgIGlmICh0eXBlb2YgbWlncmF0aW9ucyAhPSAnc3RyaW5nJykge1xuICAgICAgbG9nZ2VyLndhcm4oYG1pZ3JhdGlvbnMgbWV0YWRhdGEgb2YgcGFja2FnZSAke3BhY2thZ2VKc29uLm5hbWV9IGlzIG1hbGZvcm1lZC4gSWdub3JpbmcuYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5taWdyYXRpb25zID0gbWlncmF0aW9ucztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5cbmZ1bmN0aW9uIF91c2FnZU1lc3NhZ2UoXG4gIG9wdGlvbnM6IFVwZGF0ZVNjaGVtYSxcbiAgaW5mb01hcDogTWFwPHN0cmluZywgUGFja2FnZUluZm8+LFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuKSB7XG4gIGNvbnN0IHBhY2thZ2VHcm91cHMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBjb25zdCBwYWNrYWdlc1RvVXBkYXRlID0gWy4uLmluZm9NYXAuZW50cmllcygpXVxuICAgIC5tYXAoKFtuYW1lLCBpbmZvXSkgPT4ge1xuICAgICAgY29uc3QgdGFnID0gb3B0aW9ucy5uZXh0XG4gICAgICAgID8gKGluZm8ubnBtUGFja2FnZUpzb25bJ2Rpc3QtdGFncyddWyduZXh0J10gPyAnbmV4dCcgOiAnbGF0ZXN0JykgOiAnbGF0ZXN0JztcbiAgICAgIGNvbnN0IHZlcnNpb24gPSBpbmZvLm5wbVBhY2thZ2VKc29uWydkaXN0LXRhZ3MnXVt0YWddO1xuICAgICAgY29uc3QgdGFyZ2V0ID0gaW5mby5ucG1QYWNrYWdlSnNvbi52ZXJzaW9uc1t2ZXJzaW9uXTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgaW5mbyxcbiAgICAgICAgdmVyc2lvbixcbiAgICAgICAgdGFnLFxuICAgICAgICB0YXJnZXQsXG4gICAgICB9O1xuICAgIH0pXG4gICAgLmZpbHRlcigoeyBuYW1lLCBpbmZvLCB2ZXJzaW9uLCB0YXJnZXQgfSkgPT4ge1xuICAgICAgcmV0dXJuICh0YXJnZXQgJiYgc2VtdmVyLmNvbXBhcmUoaW5mby5pbnN0YWxsZWQudmVyc2lvbiwgdmVyc2lvbikgPCAwKTtcbiAgICB9KVxuICAgIC5maWx0ZXIoKHsgdGFyZ2V0IH0pID0+IHtcbiAgICAgIHJldHVybiB0YXJnZXRbJ25nLXVwZGF0ZSddO1xuICAgIH0pXG4gICAgLm1hcCgoeyBuYW1lLCBpbmZvLCB2ZXJzaW9uLCB0YWcsIHRhcmdldCB9KSA9PiB7XG4gICAgICAvLyBMb29rIGZvciBwYWNrYWdlR3JvdXAuXG4gICAgICBpZiAodGFyZ2V0WyduZy11cGRhdGUnXSAmJiB0YXJnZXRbJ25nLXVwZGF0ZSddWydwYWNrYWdlR3JvdXAnXSkge1xuICAgICAgICBjb25zdCBwYWNrYWdlR3JvdXAgPSB0YXJnZXRbJ25nLXVwZGF0ZSddWydwYWNrYWdlR3JvdXAnXTtcbiAgICAgICAgY29uc3QgcGFja2FnZUdyb3VwTmFtZSA9IHRhcmdldFsnbmctdXBkYXRlJ11bJ3BhY2thZ2VHcm91cE5hbWUnXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgdGFyZ2V0WyduZy11cGRhdGUnXVsncGFja2FnZUdyb3VwJ11bMF07XG4gICAgICAgIGlmIChwYWNrYWdlR3JvdXBOYW1lKSB7XG4gICAgICAgICAgaWYgKHBhY2thZ2VHcm91cHMuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwYWNrYWdlR3JvdXAuZm9yRWFjaCgoeDogc3RyaW5nKSA9PiBwYWNrYWdlR3JvdXBzLnNldCh4LCBwYWNrYWdlR3JvdXBOYW1lKSk7XG4gICAgICAgICAgcGFja2FnZUdyb3Vwcy5zZXQocGFja2FnZUdyb3VwTmFtZSwgcGFja2FnZUdyb3VwTmFtZSk7XG4gICAgICAgICAgbmFtZSA9IHBhY2thZ2VHcm91cE5hbWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbGV0IGNvbW1hbmQgPSBgbmcgdXBkYXRlICR7bmFtZX1gO1xuICAgICAgaWYgKHRhZyA9PSAnbmV4dCcpIHtcbiAgICAgICAgY29tbWFuZCArPSAnIC0tbmV4dCc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBbbmFtZSwgYCR7aW5mby5pbnN0YWxsZWQudmVyc2lvbn0gLT4gJHt2ZXJzaW9ufWAsIGNvbW1hbmRdO1xuICAgIH0pXG4gICAgLmZpbHRlcih4ID0+IHggIT09IG51bGwpXG4gICAgLnNvcnQoKGEsIGIpID0+IGEgJiYgYiA/IGFbMF0ubG9jYWxlQ29tcGFyZShiWzBdKSA6IDApO1xuXG4gIGlmIChwYWNrYWdlc1RvVXBkYXRlLmxlbmd0aCA9PSAwKSB7XG4gICAgbG9nZ2VyLmluZm8oJ1dlIGFuYWx5emVkIHlvdXIgcGFja2FnZS5qc29uIGFuZCBldmVyeXRoaW5nIHNlZW1zIHRvIGJlIGluIG9yZGVyLiBHb29kIHdvcmshJyk7XG5cbiAgICByZXR1cm4gb2Y8dm9pZD4odW5kZWZpbmVkKTtcbiAgfVxuXG4gIGxvZ2dlci5pbmZvKFxuICAgICdXZSBhbmFseXplZCB5b3VyIHBhY2thZ2UuanNvbiwgdGhlcmUgYXJlIHNvbWUgcGFja2FnZXMgdG8gdXBkYXRlOlxcbicsXG4gICk7XG5cbiAgLy8gRmluZCB0aGUgbGFyZ2VzdCBuYW1lIHRvIGtub3cgdGhlIHBhZGRpbmcgbmVlZGVkLlxuICBsZXQgbmFtZVBhZCA9IE1hdGgubWF4KC4uLlsuLi5pbmZvTWFwLmtleXMoKV0ubWFwKHggPT4geC5sZW5ndGgpKSArIDI7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKG5hbWVQYWQpKSB7XG4gICAgbmFtZVBhZCA9IDMwO1xuICB9XG4gIGNvbnN0IHBhZHMgPSBbbmFtZVBhZCwgMjUsIDBdO1xuXG4gIGxvZ2dlci5pbmZvKFxuICAgICcgICdcbiAgICArIFsnTmFtZScsICdWZXJzaW9uJywgJ0NvbW1hbmQgdG8gdXBkYXRlJ10ubWFwKCh4LCBpKSA9PiB4LnBhZEVuZChwYWRzW2ldKSkuam9pbignJyksXG4gICk7XG4gIGxvZ2dlci5pbmZvKCcgJyArICctJy5yZXBlYXQocGFkcy5yZWR1Y2UoKHMsIHgpID0+IHMgKz0geCwgMCkgKyAyMCkpO1xuXG4gIHBhY2thZ2VzVG9VcGRhdGUuZm9yRWFjaChmaWVsZHMgPT4ge1xuICAgIGlmICghZmllbGRzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nZ2VyLmluZm8oJyAgJyArIGZpZWxkcy5tYXAoKHgsIGkpID0+IHgucGFkRW5kKHBhZHNbaV0pKS5qb2luKCcnKSk7XG4gIH0pO1xuXG4gIGxvZ2dlci5pbmZvKCdcXG4nKTtcbiAgbG9nZ2VyLmluZm8oJ1RoZXJlIG1pZ2h0IGJlIGFkZGl0aW9uYWwgcGFja2FnZXMgdGhhdCBhcmUgb3V0ZGF0ZWQuJyk7XG4gIGxvZ2dlci5pbmZvKCdPciBydW4gbmcgdXBkYXRlIC0tYWxsIHRvIHRyeSB0byB1cGRhdGUgYWxsIGF0IHRoZSBzYW1lIHRpbWUuXFxuJyk7XG5cbiAgcmV0dXJuIG9mPHZvaWQ+KHVuZGVmaW5lZCk7XG59XG5cblxuZnVuY3Rpb24gX2J1aWxkUGFja2FnZUluZm8oXG4gIHRyZWU6IFRyZWUsXG4gIHBhY2thZ2VzOiBNYXA8c3RyaW5nLCBWZXJzaW9uUmFuZ2U+LFxuICBhbGxEZXBlbmRlbmNpZXM6IFJlYWRvbmx5TWFwPHN0cmluZywgVmVyc2lvblJhbmdlPixcbiAgbnBtUGFja2FnZUpzb246IE5wbVJlcG9zaXRvcnlQYWNrYWdlSnNvbixcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbik6IFBhY2thZ2VJbmZvIHtcbiAgY29uc3QgbmFtZSA9IG5wbVBhY2thZ2VKc29uLm5hbWU7XG4gIGNvbnN0IHBhY2thZ2VKc29uUmFuZ2UgPSBhbGxEZXBlbmRlbmNpZXMuZ2V0KG5hbWUpO1xuICBpZiAoIXBhY2thZ2VKc29uUmFuZ2UpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgIGBQYWNrYWdlICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IHdhcyBub3QgZm91bmQgaW4gcGFja2FnZS5qc29uLmAsXG4gICAgKTtcbiAgfVxuXG4gIC8vIEZpbmQgb3V0IHRoZSBjdXJyZW50bHkgaW5zdGFsbGVkIHZlcnNpb24uIEVpdGhlciBmcm9tIHRoZSBwYWNrYWdlLmpzb24gb3IgdGhlIG5vZGVfbW9kdWxlcy9cbiAgLy8gVE9ETzogZmlndXJlIG91dCBhIHdheSB0byByZWFkIHBhY2thZ2UtbG9jay5qc29uIGFuZC9vciB5YXJuLmxvY2suXG4gIGxldCBpbnN0YWxsZWRWZXJzaW9uOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGNvbnN0IHBhY2thZ2VDb250ZW50ID0gdHJlZS5yZWFkKGAvbm9kZV9tb2R1bGVzLyR7bmFtZX0vcGFja2FnZS5qc29uYCk7XG4gIGlmIChwYWNrYWdlQ29udGVudCkge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBKU09OLnBhcnNlKHBhY2thZ2VDb250ZW50LnRvU3RyaW5nKCkpIGFzIEpzb25TY2hlbWFGb3JOcG1QYWNrYWdlSnNvbkZpbGVzO1xuICAgIGluc3RhbGxlZFZlcnNpb24gPSBjb250ZW50LnZlcnNpb247XG4gIH1cbiAgaWYgKCFpbnN0YWxsZWRWZXJzaW9uKSB7XG4gICAgLy8gRmluZCB0aGUgdmVyc2lvbiBmcm9tIE5QTSB0aGF0IGZpdHMgdGhlIHJhbmdlIHRvIG1heC5cbiAgICBpbnN0YWxsZWRWZXJzaW9uID0gc2VtdmVyLm1heFNhdGlzZnlpbmcoXG4gICAgICBPYmplY3Qua2V5cyhucG1QYWNrYWdlSnNvbi52ZXJzaW9ucyksXG4gICAgICBwYWNrYWdlSnNvblJhbmdlLFxuICAgICk7XG4gIH1cblxuICBjb25zdCBpbnN0YWxsZWRQYWNrYWdlSnNvbiA9IG5wbVBhY2thZ2VKc29uLnZlcnNpb25zW2luc3RhbGxlZFZlcnNpb25dIHx8IHBhY2thZ2VDb250ZW50O1xuICBpZiAoIWluc3RhbGxlZFBhY2thZ2VKc29uKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICBgQW4gdW5leHBlY3RlZCBlcnJvciBoYXBwZW5lZDsgcGFja2FnZSAke25hbWV9IGhhcyBubyB2ZXJzaW9uICR7aW5zdGFsbGVkVmVyc2lvbn0uYCxcbiAgICApO1xuICB9XG5cbiAgbGV0IHRhcmdldFZlcnNpb246IFZlcnNpb25SYW5nZSB8IHVuZGVmaW5lZCA9IHBhY2thZ2VzLmdldChuYW1lKTtcbiAgaWYgKHRhcmdldFZlcnNpb24pIHtcbiAgICBpZiAobnBtUGFja2FnZUpzb25bJ2Rpc3QtdGFncyddW3RhcmdldFZlcnNpb25dKSB7XG4gICAgICB0YXJnZXRWZXJzaW9uID0gbnBtUGFja2FnZUpzb25bJ2Rpc3QtdGFncyddW3RhcmdldFZlcnNpb25dIGFzIFZlcnNpb25SYW5nZTtcbiAgICB9IGVsc2UgaWYgKHRhcmdldFZlcnNpb24gPT0gJ25leHQnKSB7XG4gICAgICB0YXJnZXRWZXJzaW9uID0gbnBtUGFja2FnZUpzb25bJ2Rpc3QtdGFncyddWydsYXRlc3QnXSBhcyBWZXJzaW9uUmFuZ2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRhcmdldFZlcnNpb24gPSBzZW12ZXIubWF4U2F0aXNmeWluZyhcbiAgICAgICAgT2JqZWN0LmtleXMobnBtUGFja2FnZUpzb24udmVyc2lvbnMpLFxuICAgICAgICB0YXJnZXRWZXJzaW9uLFxuICAgICAgKSBhcyBWZXJzaW9uUmFuZ2U7XG4gICAgfVxuICB9XG5cbiAgaWYgKHRhcmdldFZlcnNpb24gJiYgc2VtdmVyLmx0ZSh0YXJnZXRWZXJzaW9uLCBpbnN0YWxsZWRWZXJzaW9uKSkge1xuICAgIGxvZ2dlci5kZWJ1ZyhgUGFja2FnZSAke25hbWV9IGFscmVhZHkgc2F0aXNmaWVkIGJ5IHBhY2thZ2UuanNvbiAoJHtwYWNrYWdlSnNvblJhbmdlfSkuYCk7XG4gICAgdGFyZ2V0VmVyc2lvbiA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IHRhcmdldDogUGFja2FnZVZlcnNpb25JbmZvIHwgdW5kZWZpbmVkID0gdGFyZ2V0VmVyc2lvblxuICAgID8ge1xuICAgICAgdmVyc2lvbjogdGFyZ2V0VmVyc2lvbixcbiAgICAgIHBhY2thZ2VKc29uOiBucG1QYWNrYWdlSnNvbi52ZXJzaW9uc1t0YXJnZXRWZXJzaW9uXSxcbiAgICAgIHVwZGF0ZU1ldGFkYXRhOiBfZ2V0VXBkYXRlTWV0YWRhdGEobnBtUGFja2FnZUpzb24udmVyc2lvbnNbdGFyZ2V0VmVyc2lvbl0sIGxvZ2dlciksXG4gICAgfVxuICAgIDogdW5kZWZpbmVkO1xuXG4gIC8vIENoZWNrIGlmIHRoZXJlJ3MgYW4gaW5zdGFsbGVkIHZlcnNpb24uXG4gIHJldHVybiB7XG4gICAgbmFtZSxcbiAgICBucG1QYWNrYWdlSnNvbixcbiAgICBpbnN0YWxsZWQ6IHtcbiAgICAgIHZlcnNpb246IGluc3RhbGxlZFZlcnNpb24gYXMgVmVyc2lvblJhbmdlLFxuICAgICAgcGFja2FnZUpzb246IGluc3RhbGxlZFBhY2thZ2VKc29uLFxuICAgICAgdXBkYXRlTWV0YWRhdGE6IF9nZXRVcGRhdGVNZXRhZGF0YShpbnN0YWxsZWRQYWNrYWdlSnNvbiwgbG9nZ2VyKSxcbiAgICB9LFxuICAgIHRhcmdldCxcbiAgICBwYWNrYWdlSnNvblJhbmdlLFxuICB9O1xufVxuXG5cbmZ1bmN0aW9uIF9idWlsZFBhY2thZ2VMaXN0KFxuICBvcHRpb25zOiBVcGRhdGVTY2hlbWEsXG4gIHByb2plY3REZXBzOiBNYXA8c3RyaW5nLCBWZXJzaW9uUmFuZ2U+LFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuKTogTWFwPHN0cmluZywgVmVyc2lvblJhbmdlPiB7XG4gIC8vIFBhcnNlIHRoZSBwYWNrYWdlcyBvcHRpb25zIHRvIHNldCB0aGUgdGFyZ2V0ZWQgdmVyc2lvbi5cbiAgY29uc3QgcGFja2FnZXMgPSBuZXcgTWFwPHN0cmluZywgVmVyc2lvblJhbmdlPigpO1xuICBjb25zdCBjb21tYW5kTGluZVBhY2thZ2VzID1cbiAgICAob3B0aW9ucy5wYWNrYWdlcyAmJiBvcHRpb25zLnBhY2thZ2VzLmxlbmd0aCA+IDApXG4gICAgPyBvcHRpb25zLnBhY2thZ2VzXG4gICAgOiAob3B0aW9ucy5hbGwgPyBwcm9qZWN0RGVwcy5rZXlzKCkgOiBbXSk7XG5cbiAgZm9yIChjb25zdCBwa2cgb2YgY29tbWFuZExpbmVQYWNrYWdlcykge1xuICAgIC8vIFNwbGl0IHRoZSB2ZXJzaW9uIGFza2VkIG9uIGNvbW1hbmQgbGluZS5cbiAgICBjb25zdCBtID0gcGtnLm1hdGNoKC9eKCg/OkBbXi9dezEsMTAwfVxcLyk/W15AXXsxLDEwMH0pKD86QCguezEsMTAwfSkpPyQvKTtcbiAgICBpZiAoIW0pIHtcbiAgICAgIGxvZ2dlci53YXJuKGBJbnZhbGlkIHBhY2thZ2UgYXJndW1lbnQ6ICR7SlNPTi5zdHJpbmdpZnkocGtnKX0uIFNraXBwaW5nLmApO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgWywgbnBtTmFtZSwgbWF5YmVWZXJzaW9uXSA9IG07XG5cbiAgICBjb25zdCB2ZXJzaW9uID0gcHJvamVjdERlcHMuZ2V0KG5wbU5hbWUpO1xuICAgIGlmICghdmVyc2lvbikge1xuICAgICAgbG9nZ2VyLndhcm4oYFBhY2thZ2Ugbm90IGluc3RhbGxlZDogJHtKU09OLnN0cmluZ2lmeShucG1OYW1lKX0uIFNraXBwaW5nLmApO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gVmVyaWZ5IHRoYXQgcGVvcGxlIGhhdmUgYW4gYWN0dWFsIHZlcnNpb24gaW4gdGhlIHBhY2thZ2UuanNvbiwgb3RoZXJ3aXNlIChsYWJlbCBvciBVUkwgb3JcbiAgICAvLyBnaXN0IG9yIC4uLikgd2UgZG9uJ3QgdXBkYXRlIGl0LlxuICAgIGlmIChcbiAgICAgIHZlcnNpb24uc3RhcnRzV2l0aCgnaHR0cDonKSAgLy8gSFRUUFxuICAgICAgfHwgdmVyc2lvbi5zdGFydHNXaXRoKCdmaWxlOicpICAvLyBMb2NhbCBmb2xkZXJcbiAgICAgIHx8IHZlcnNpb24uc3RhcnRzV2l0aCgnZ2l0OicpICAvLyBHSVQgdXJsXG4gICAgICB8fCB2ZXJzaW9uLm1hdGNoKC9eXFx3ezEsMTAwfVxcL1xcd3sxLDEwMH0vKSAgLy8gR2l0SHViJ3MgXCJ1c2VyL3JlcG9cIlxuICAgICAgfHwgdmVyc2lvbi5tYXRjaCgvXig/OlxcLnswLDJ9XFwvKVxcd3sxLDEwMH0vKSAgLy8gTG9jYWwgZm9sZGVyLCBtYXliZSByZWxhdGl2ZS5cbiAgICApIHtcbiAgICAgIC8vIFdlIG9ubHkgZG8gdGhhdCBmb3IgLS1hbGwuIE90aGVyd2lzZSB3ZSBoYXZlIHRoZSBpbnN0YWxsZWQgdmVyc2lvbiBhbmQgdGhlIHVzZXIgc3BlY2lmaWVkXG4gICAgICAvLyBpdCBvbiB0aGUgY29tbWFuZCBsaW5lLlxuICAgICAgaWYgKG9wdGlvbnMuYWxsKSB7XG4gICAgICAgIGxvZ2dlci53YXJuKFxuICAgICAgICAgIGBQYWNrYWdlICR7SlNPTi5zdHJpbmdpZnkobnBtTmFtZSl9IGhhcyBhIGN1c3RvbSB2ZXJzaW9uOiBgXG4gICAgICAgICAgKyBgJHtKU09OLnN0cmluZ2lmeSh2ZXJzaW9uKX0uIFNraXBwaW5nLmAsXG4gICAgICAgICk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHBhY2thZ2VzLnNldChucG1OYW1lLCAobWF5YmVWZXJzaW9uIHx8IChvcHRpb25zLm5leHQgPyAnbmV4dCcgOiAnbGF0ZXN0JykpIGFzIFZlcnNpb25SYW5nZSk7XG4gIH1cblxuICByZXR1cm4gcGFja2FnZXM7XG59XG5cblxuZnVuY3Rpb24gX2FkZFBhY2thZ2VHcm91cChcbiAgdHJlZTogVHJlZSxcbiAgcGFja2FnZXM6IE1hcDxzdHJpbmcsIFZlcnNpb25SYW5nZT4sXG4gIGFsbERlcGVuZGVuY2llczogUmVhZG9ubHlNYXA8c3RyaW5nLCBWZXJzaW9uUmFuZ2U+LFxuICBucG1QYWNrYWdlSnNvbjogTnBtUmVwb3NpdG9yeVBhY2thZ2VKc29uLFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuKTogdm9pZCB7XG4gIGNvbnN0IG1heWJlUGFja2FnZSA9IHBhY2thZ2VzLmdldChucG1QYWNrYWdlSnNvbi5uYW1lKTtcbiAgaWYgKCFtYXliZVBhY2thZ2UpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBpbmZvID0gX2J1aWxkUGFja2FnZUluZm8odHJlZSwgcGFja2FnZXMsIGFsbERlcGVuZGVuY2llcywgbnBtUGFja2FnZUpzb24sIGxvZ2dlcik7XG5cbiAgY29uc3QgdmVyc2lvbiA9IChpbmZvLnRhcmdldCAmJiBpbmZvLnRhcmdldC52ZXJzaW9uKVxuICAgICAgICAgICAgICAgfHwgbnBtUGFja2FnZUpzb25bJ2Rpc3QtdGFncyddW21heWJlUGFja2FnZV1cbiAgICAgICAgICAgICAgIHx8IG1heWJlUGFja2FnZTtcbiAgaWYgKCFucG1QYWNrYWdlSnNvbi52ZXJzaW9uc1t2ZXJzaW9uXSkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBuZ1VwZGF0ZU1ldGFkYXRhID0gbnBtUGFja2FnZUpzb24udmVyc2lvbnNbdmVyc2lvbl1bJ25nLXVwZGF0ZSddO1xuICBpZiAoIW5nVXBkYXRlTWV0YWRhdGEpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBwYWNrYWdlR3JvdXAgPSBuZ1VwZGF0ZU1ldGFkYXRhWydwYWNrYWdlR3JvdXAnXTtcbiAgaWYgKCFwYWNrYWdlR3JvdXApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKCFBcnJheS5pc0FycmF5KHBhY2thZ2VHcm91cCkgfHwgcGFja2FnZUdyb3VwLnNvbWUoeCA9PiB0eXBlb2YgeCAhPSAnc3RyaW5nJykpIHtcbiAgICBsb2dnZXIud2FybihgcGFja2FnZUdyb3VwIG1ldGFkYXRhIG9mIHBhY2thZ2UgJHtucG1QYWNrYWdlSnNvbi5uYW1lfSBpcyBtYWxmb3JtZWQuYCk7XG5cbiAgICByZXR1cm47XG4gIH1cblxuICBwYWNrYWdlR3JvdXBcbiAgICAuZmlsdGVyKG5hbWUgPT4gIXBhY2thZ2VzLmhhcyhuYW1lKSkgIC8vIERvbid0IG92ZXJyaWRlIG5hbWVzIGZyb20gdGhlIGNvbW1hbmQgbGluZS5cbiAgICAuZmlsdGVyKG5hbWUgPT4gYWxsRGVwZW5kZW5jaWVzLmhhcyhuYW1lKSkgIC8vIFJlbW92ZSBwYWNrYWdlcyB0aGF0IGFyZW4ndCBpbnN0YWxsZWQuXG4gICAgLmZvckVhY2gobmFtZSA9PiB7XG4gICAgcGFja2FnZXMuc2V0KG5hbWUsIG1heWJlUGFja2FnZSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIEFkZCBwZWVyIGRlcGVuZGVuY2llcyBvZiBwYWNrYWdlcyBvbiB0aGUgY29tbWFuZCBsaW5lIHRvIHRoZSBsaXN0IG9mIHBhY2thZ2VzIHRvIHVwZGF0ZS5cbiAqIFdlIGRvbid0IGRvIHZlcmlmaWNhdGlvbiBvZiB0aGUgdmVyc2lvbnMgaGVyZSBhcyB0aGlzIHdpbGwgYmUgZG9uZSBieSBhIGxhdGVyIHN0ZXAgKGFuZCBjYW5cbiAqIGJlIGlnbm9yZWQgYnkgdGhlIC0tZm9yY2UgZmxhZykuXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBfYWRkUGVlckRlcGVuZGVuY2llcyhcbiAgdHJlZTogVHJlZSxcbiAgcGFja2FnZXM6IE1hcDxzdHJpbmcsIFZlcnNpb25SYW5nZT4sXG4gIGFsbERlcGVuZGVuY2llczogUmVhZG9ubHlNYXA8c3RyaW5nLCBWZXJzaW9uUmFuZ2U+LFxuICBucG1QYWNrYWdlSnNvbjogTnBtUmVwb3NpdG9yeVBhY2thZ2VKc29uLFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuKTogdm9pZCB7XG4gIGNvbnN0IG1heWJlUGFja2FnZSA9IHBhY2thZ2VzLmdldChucG1QYWNrYWdlSnNvbi5uYW1lKTtcbiAgaWYgKCFtYXliZVBhY2thZ2UpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBpbmZvID0gX2J1aWxkUGFja2FnZUluZm8odHJlZSwgcGFja2FnZXMsIGFsbERlcGVuZGVuY2llcywgbnBtUGFja2FnZUpzb24sIGxvZ2dlcik7XG5cbiAgY29uc3QgdmVyc2lvbiA9IChpbmZvLnRhcmdldCAmJiBpbmZvLnRhcmdldC52ZXJzaW9uKVxuICAgICAgICAgICAgICAgfHwgbnBtUGFja2FnZUpzb25bJ2Rpc3QtdGFncyddW21heWJlUGFja2FnZV1cbiAgICAgICAgICAgICAgIHx8IG1heWJlUGFja2FnZTtcbiAgaWYgKCFucG1QYWNrYWdlSnNvbi52ZXJzaW9uc1t2ZXJzaW9uXSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHBhY2thZ2VKc29uID0gbnBtUGFja2FnZUpzb24udmVyc2lvbnNbdmVyc2lvbl07XG4gIGNvbnN0IGVycm9yID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCBbcGVlciwgcmFuZ2VdIG9mIE9iamVjdC5lbnRyaWVzKHBhY2thZ2VKc29uLnBlZXJEZXBlbmRlbmNpZXMgfHwge30pKSB7XG4gICAgaWYgKCFwYWNrYWdlcy5oYXMocGVlcikpIHtcbiAgICAgIHBhY2thZ2VzLnNldChwZWVyLCByYW5nZSBhcyBWZXJzaW9uUmFuZ2UpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChlcnJvcikge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKCdBbiBlcnJvciBvY2N1cmVkLCBzZWUgYWJvdmUuJyk7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBfZ2V0QWxsRGVwZW5kZW5jaWVzKHRyZWU6IFRyZWUpOiBNYXA8c3RyaW5nLCBWZXJzaW9uUmFuZ2U+IHtcbiAgY29uc3QgcGFja2FnZUpzb25Db250ZW50ID0gdHJlZS5yZWFkKCcvcGFja2FnZS5qc29uJyk7XG4gIGlmICghcGFja2FnZUpzb25Db250ZW50KSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ0NvdWxkIG5vdCBmaW5kIGEgcGFja2FnZS5qc29uLiBBcmUgeW91IGluIGEgTm9kZSBwcm9qZWN0PycpO1xuICB9XG5cbiAgbGV0IHBhY2thZ2VKc29uOiBKc29uU2NoZW1hRm9yTnBtUGFja2FnZUpzb25GaWxlcztcbiAgdHJ5IHtcbiAgICBwYWNrYWdlSnNvbiA9IEpTT04ucGFyc2UocGFja2FnZUpzb25Db250ZW50LnRvU3RyaW5nKCkpIGFzIEpzb25TY2hlbWFGb3JOcG1QYWNrYWdlSnNvbkZpbGVzO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ3BhY2thZ2UuanNvbiBjb3VsZCBub3QgYmUgcGFyc2VkOiAnICsgZS5tZXNzYWdlKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgTWFwPHN0cmluZywgVmVyc2lvblJhbmdlPihbXG4gICAgLi4uT2JqZWN0LmVudHJpZXMocGFja2FnZUpzb24ucGVlckRlcGVuZGVuY2llcyB8fCB7fSksXG4gICAgLi4uT2JqZWN0LmVudHJpZXMocGFja2FnZUpzb24uZGV2RGVwZW5kZW5jaWVzIHx8IHt9KSxcbiAgICAuLi5PYmplY3QuZW50cmllcyhwYWNrYWdlSnNvbi5kZXBlbmRlbmNpZXMgfHwge30pLFxuICBdIGFzIFtzdHJpbmcsIFZlcnNpb25SYW5nZV1bXSk7XG59XG5cbmZ1bmN0aW9uIF9mb3JtYXRWZXJzaW9uKHZlcnNpb246IHN0cmluZyB8IHVuZGVmaW5lZCkge1xuICBpZiAodmVyc2lvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGlmICghdmVyc2lvbi5tYXRjaCgvXlxcZHsxLDMwfVxcLlxcZHsxLDMwfVxcLlxcZHsxLDMwfS8pKSB7XG4gICAgdmVyc2lvbiArPSAnLjAnO1xuICB9XG4gIGlmICghdmVyc2lvbi5tYXRjaCgvXlxcZHsxLDMwfVxcLlxcZHsxLDMwfVxcLlxcZHsxLDMwfS8pKSB7XG4gICAgdmVyc2lvbiArPSAnLjAnO1xuICB9XG4gIGlmICghc2VtdmVyLnZhbGlkKHZlcnNpb24pKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYEludmFsaWQgbWlncmF0aW9uIHZlcnNpb246ICR7SlNPTi5zdHJpbmdpZnkodmVyc2lvbil9YCk7XG4gIH1cblxuICByZXR1cm4gdmVyc2lvbjtcbn1cblxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihvcHRpb25zOiBVcGRhdGVTY2hlbWEpOiBSdWxlIHtcbiAgaWYgKCFvcHRpb25zLnBhY2thZ2VzKSB7XG4gICAgLy8gV2UgY2Fubm90IGp1c3QgcmV0dXJuIHRoaXMgYmVjYXVzZSB3ZSBuZWVkIHRvIGZldGNoIHRoZSBwYWNrYWdlcyBmcm9tIE5QTSBzdGlsbCBmb3IgdGhlXG4gICAgLy8gaGVscC9ndWlkZSB0byBzaG93LlxuICAgIG9wdGlvbnMucGFja2FnZXMgPSBbXTtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygb3B0aW9ucy5wYWNrYWdlcyA9PSAnc3RyaW5nJykge1xuICAgIC8vIElmIGEgc3RyaW5nLCB0aGVuIHdlIHNob3VsZCBzcGxpdCBpdCBhbmQgbWFrZSBpdCBhbiBhcnJheS5cbiAgICBvcHRpb25zLnBhY2thZ2VzID0gb3B0aW9ucy5wYWNrYWdlcy5zcGxpdCgvLC9nKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLm1pZ3JhdGVPbmx5ICYmIG9wdGlvbnMuZnJvbSkge1xuICAgIGlmIChvcHRpb25zLnBhY2thZ2VzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJy0tZnJvbSByZXF1aXJlcyB0aGF0IG9ubHkgYSBzaW5nbGUgcGFja2FnZSBiZSBwYXNzZWQuJyk7XG4gICAgfVxuICB9XG5cbiAgb3B0aW9ucy5mcm9tID0gX2Zvcm1hdFZlcnNpb24ob3B0aW9ucy5mcm9tKTtcbiAgb3B0aW9ucy50byA9IF9mb3JtYXRWZXJzaW9uKG9wdGlvbnMudG8pO1xuXG4gIHJldHVybiAodHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IGxvZ2dlciA9IGNvbnRleHQubG9nZ2VyO1xuICAgIGNvbnN0IGFsbERlcGVuZGVuY2llcyA9IF9nZXRBbGxEZXBlbmRlbmNpZXModHJlZSk7XG4gICAgY29uc3QgcGFja2FnZXMgPSBfYnVpbGRQYWNrYWdlTGlzdChvcHRpb25zLCBhbGxEZXBlbmRlbmNpZXMsIGxvZ2dlcik7XG5cbiAgICByZXR1cm4gb2JzZXJ2YWJsZUZyb20oWy4uLmFsbERlcGVuZGVuY2llcy5rZXlzKCldKS5waXBlKFxuICAgICAgLy8gR3JhYiBhbGwgcGFja2FnZS5qc29uIGZyb20gdGhlIG5wbSByZXBvc2l0b3J5LiBUaGlzIHJlcXVpcmVzIGEgbG90IG9mIEhUVFAgY2FsbHMgc28gd2VcbiAgICAgIC8vIHRyeSB0byBwYXJhbGxlbGl6ZSBhcyBtYW55IGFzIHBvc3NpYmxlLlxuICAgICAgbWVyZ2VNYXAoZGVwTmFtZSA9PiBnZXROcG1QYWNrYWdlSnNvbihkZXBOYW1lLCBvcHRpb25zLnJlZ2lzdHJ5LCBsb2dnZXIpKSxcblxuICAgICAgLy8gQnVpbGQgYSBtYXAgb2YgYWxsIGRlcGVuZGVuY2llcyBhbmQgdGhlaXIgcGFja2FnZUpzb24uXG4gICAgICByZWR1Y2U8TnBtUmVwb3NpdG9yeVBhY2thZ2VKc29uLCBNYXA8c3RyaW5nLCBOcG1SZXBvc2l0b3J5UGFja2FnZUpzb24+PihcbiAgICAgICAgKGFjYywgbnBtUGFja2FnZUpzb24pID0+IHtcbiAgICAgICAgICAvLyBJZiB0aGUgcGFja2FnZSB3YXMgbm90IGZvdW5kIG9uIHRoZSByZWdpc3RyeS4gSXQgY291bGQgYmUgcHJpdmF0ZSwgc28gd2Ugd2lsbCBqdXN0XG4gICAgICAgICAgLy8gaWdub3JlLiBJZiB0aGUgcGFja2FnZSB3YXMgcGFydCBvZiB0aGUgbGlzdCwgd2Ugd2lsbCBlcnJvciBvdXQsIGJ1dCB3aWxsIHNpbXBseSBpZ25vcmVcbiAgICAgICAgICAvLyBpZiBpdCdzIGVpdGhlciBub3QgcmVxdWVzdGVkIChzbyBqdXN0IHBhcnQgb2YgcGFja2FnZS5qc29uLiBzaWxlbnRseSkgb3IgaWYgaXQncyBhXG4gICAgICAgICAgLy8gYC0tYWxsYCBzaXR1YXRpb24uIFRoZXJlIGlzIGFuIGVkZ2UgY2FzZSBoZXJlIHdoZXJlIGEgcHVibGljIHBhY2thZ2UgcGVlciBkZXBlbmRzIG9uIGFcbiAgICAgICAgICAvLyBwcml2YXRlIG9uZSwgYnV0IGl0J3MgcmFyZSBlbm91Z2guXG4gICAgICAgICAgaWYgKCFucG1QYWNrYWdlSnNvbi5uYW1lKSB7XG4gICAgICAgICAgICBpZiAocGFja2FnZXMuaGFzKG5wbVBhY2thZ2VKc29uLnJlcXVlc3RlZE5hbWUpKSB7XG4gICAgICAgICAgICAgIGlmIChvcHRpb25zLmFsbCkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKGBQYWNrYWdlICR7SlNPTi5zdHJpbmdpZnkobnBtUGFja2FnZUpzb24ucmVxdWVzdGVkTmFtZSl9IHdhcyBub3QgYFxuICAgICAgICAgICAgICAgICAgKyAnZm91bmQgb24gdGhlIHJlZ2lzdHJ5LiBTa2lwcGluZy4nKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAgICAgICAgIGBQYWNrYWdlICR7SlNPTi5zdHJpbmdpZnkobnBtUGFja2FnZUpzb24ucmVxdWVzdGVkTmFtZSl9IHdhcyBub3QgZm91bmQgb24gdGhlIGBcbiAgICAgICAgICAgICAgICAgICsgJ3JlZ2lzdHJ5LiBDYW5ub3QgY29udGludWUgYXMgdGhpcyBtYXkgYmUgYW4gZXJyb3IuJyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWNjLnNldChucG1QYWNrYWdlSnNvbi5uYW1lLCBucG1QYWNrYWdlSnNvbik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfSxcbiAgICAgICAgbmV3IE1hcDxzdHJpbmcsIE5wbVJlcG9zaXRvcnlQYWNrYWdlSnNvbj4oKSxcbiAgICAgICksXG5cbiAgICAgIG1hcChucG1QYWNrYWdlSnNvbk1hcCA9PiB7XG4gICAgICAgIC8vIEF1Z21lbnQgdGhlIGNvbW1hbmQgbGluZSBwYWNrYWdlIGxpc3Qgd2l0aCBwYWNrYWdlR3JvdXBzIGFuZCBmb3J3YXJkIHBlZXIgZGVwZW5kZW5jaWVzLlxuICAgICAgICAvLyBFYWNoIGFkZGVkIHBhY2thZ2UgbWF5IHVuY292ZXIgbmV3IHBhY2thZ2UgZ3JvdXBzIGFuZCBwZWVyIGRlcGVuZGVuY2llcywgc28gd2UgbXVzdFxuICAgICAgICAvLyByZXBlYXQgdGhpcyBwcm9jZXNzIHVudGlsIHRoZSBwYWNrYWdlIGxpc3Qgc3RhYmlsaXplcy5cbiAgICAgICAgbGV0IGxhc3RQYWNrYWdlc1NpemU7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICBsYXN0UGFja2FnZXNTaXplID0gcGFja2FnZXMuc2l6ZTtcbiAgICAgICAgICBucG1QYWNrYWdlSnNvbk1hcC5mb3JFYWNoKChucG1QYWNrYWdlSnNvbikgPT4ge1xuICAgICAgICAgICAgX2FkZFBhY2thZ2VHcm91cCh0cmVlLCBwYWNrYWdlcywgYWxsRGVwZW5kZW5jaWVzLCBucG1QYWNrYWdlSnNvbiwgbG9nZ2VyKTtcbiAgICAgICAgICAgIF9hZGRQZWVyRGVwZW5kZW5jaWVzKHRyZWUsIHBhY2thZ2VzLCBhbGxEZXBlbmRlbmNpZXMsIG5wbVBhY2thZ2VKc29uLCBsb2dnZXIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IHdoaWxlIChwYWNrYWdlcy5zaXplID4gbGFzdFBhY2thZ2VzU2l6ZSk7XG5cbiAgICAgICAgLy8gQnVpbGQgdGhlIFBhY2thZ2VJbmZvIGZvciBlYWNoIG1vZHVsZS5cbiAgICAgICAgY29uc3QgcGFja2FnZUluZm9NYXAgPSBuZXcgTWFwPHN0cmluZywgUGFja2FnZUluZm8+KCk7XG4gICAgICAgIG5wbVBhY2thZ2VKc29uTWFwLmZvckVhY2goKG5wbVBhY2thZ2VKc29uKSA9PiB7XG4gICAgICAgICAgcGFja2FnZUluZm9NYXAuc2V0KFxuICAgICAgICAgICAgbnBtUGFja2FnZUpzb24ubmFtZSxcbiAgICAgICAgICAgIF9idWlsZFBhY2thZ2VJbmZvKHRyZWUsIHBhY2thZ2VzLCBhbGxEZXBlbmRlbmNpZXMsIG5wbVBhY2thZ2VKc29uLCBsb2dnZXIpLFxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBwYWNrYWdlSW5mb01hcDtcbiAgICAgIH0pLFxuXG4gICAgICBzd2l0Y2hNYXAoaW5mb01hcCA9PiB7XG4gICAgICAgIC8vIE5vdyB0aGF0IHdlIGhhdmUgYWxsIHRoZSBpbmZvcm1hdGlvbiwgY2hlY2sgdGhlIGZsYWdzLlxuICAgICAgICBpZiAocGFja2FnZXMuc2l6ZSA+IDApIHtcbiAgICAgICAgICBpZiAob3B0aW9ucy5taWdyYXRlT25seSAmJiBvcHRpb25zLmZyb20gJiYgb3B0aW9ucy5wYWNrYWdlcykge1xuICAgICAgICAgICAgcmV0dXJuIF9taWdyYXRlT25seShcbiAgICAgICAgICAgICAgaW5mb01hcC5nZXQob3B0aW9ucy5wYWNrYWdlc1swXSksXG4gICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICAgIG9wdGlvbnMuZnJvbSxcbiAgICAgICAgICAgICAgb3B0aW9ucy50byxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3Qgc3VibG9nID0gbmV3IGxvZ2dpbmcuTGV2ZWxDYXBMb2dnZXIoXG4gICAgICAgICAgICAndmFsaWRhdGlvbicsXG4gICAgICAgICAgICBsb2dnZXIuY3JlYXRlQ2hpbGQoJycpLFxuICAgICAgICAgICAgJ3dhcm4nLFxuICAgICAgICAgICk7XG4gICAgICAgICAgX3ZhbGlkYXRlVXBkYXRlUGFja2FnZXMoaW5mb01hcCwgb3B0aW9ucy5mb3JjZSwgc3VibG9nKTtcblxuICAgICAgICAgIHJldHVybiBfcGVyZm9ybVVwZGF0ZSh0cmVlLCBjb250ZXh0LCBpbmZvTWFwLCBsb2dnZXIsIG9wdGlvbnMubWlncmF0ZU9ubHkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBfdXNhZ2VNZXNzYWdlKG9wdGlvbnMsIGluZm9NYXAsIGxvZ2dlcik7XG4gICAgICAgIH1cbiAgICAgIH0pLFxuXG4gICAgICBzd2l0Y2hNYXAoKCkgPT4gb2YodHJlZSkpLFxuICAgICk7XG4gIH07XG59XG4iXX0=