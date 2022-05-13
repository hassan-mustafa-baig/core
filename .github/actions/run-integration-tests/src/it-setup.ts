import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as path from 'path'

interface PropertyOverride {
  original: string
  replacement: string
}

interface FileOverride {
  file: string
  properties: PropertyOverride[]
}

interface OverrideProperties {
  files: FileOverride[]
}

interface FileAppend {
  file: string
  lines: string[]
}

interface AppendProperties {
  files: FileAppend[]
}

const TEST_RESOURCES = ['log4j2.xml']
const SOURCE_TEST_RESOURCES_FOLDER = 'cicd/resources'
const TARGET_TEST_RESOURCES_FOLDER = 'dotCMS/src/test/resources'
const LICENSE_FOLDER = 'custom/dotsecure/license'
const IT_FOLDERS = [
  'custom/assets',
  'custom/dotsecure',
  'custom/esdata',
  'custom/output/log',
  'custom/felix',
  LICENSE_FOLDER
]

const projectRoot = core.getInput('project_root')
const debug = core.getBooleanInput('debug')
const worskpaceFolder = path.dirname(projectRoot)

/**
 * Setup location folders and files. Override and add properties to config files so ITs can run.
 *
 * @param propertyMap properties vaslues map
 */
export const setupTests = (propertyMap: Map<string, string>) => {
  // prepare folders and copy files
  prepareTests()

  // override existing properties
  overrideProperties(propertyMap)

  // append new properties
  appendProperties(propertyMap)

  // prepare license
  prepareLicense()
}

/**
 * Gets the value from the properties map otherwise empty.
 *
 * @param propertyMap properties map
 * @param key key to look for
 * @returns value found in the map
 */
const getValue = (propertyMap: Map<string, string>, key: string): string => propertyMap.get(key) || ''

/**
 * Prepares by creating necessary folders and copying files.
 */
const prepareTests = () => {
  core.info('Preparing integration tests')
  IT_FOLDERS.forEach(folder => {
    const itFolder = path.join(worskpaceFolder, folder)
    core.info(`Creating IT folder ${itFolder}`)
    fs.mkdirSync(itFolder, {recursive: true})
  })

  TEST_RESOURCES.forEach(res => {
    const source = path.join(projectRoot, SOURCE_TEST_RESOURCES_FOLDER, res)
    const dest = path.join(projectRoot, TARGET_TEST_RESOURCES_FOLDER, res)
    core.info(`Copying resource ${source} to ${dest}`)
    fs.copyFileSync(source, dest)
  })
}

/**
 * Overrides with provided values the defined config files.
 *
 * @param propertyMap properties map
 */
const overrideProperties = async (propertyMap: Map<string, string>) => {
  core.info('Overriding properties')
  const overrides = getOverrides(propertyMap)
  core.info(`Detected overrides ${JSON.stringify(overrides, null, 2)}`)

  for (const file of overrides.files) {
    core.info(`Overriding properties at ${file.file}`)
    for (const prop of file.properties) {
      await exec.exec('sed', ['-i', `s,${prop.original},${prop.replacement},g`, file.file])
    }

    if (debug) {
      core.info(`Reviewing changes for ${file.file}`)
      await exec.exec('cat', [file.file])
    }
  }
}

/**
 * Append provided properties to defined config files.
 *
 * @param propertyMap properties map
 */
const appendProperties = (propertyMap: Map<string, string>) => {
  core.info('Adding properties')
  const appends = getAppends(propertyMap)
  core.info(`Detected appends ${JSON.stringify(appends, null, 2)}`)

  appends.files.forEach(file => {
    core.info(`Appending properties to ${file.file}`)
    const line = file.lines.join('\n')
    core.info(`Appeding properties:\n ${line}`)
    fs.appendFileSync(file.file, line, {encoding: 'utf8', flag: 'a+', mode: 0o666})
  })
}

/**
 * Get override properties object
 *
 * @param propertyMap properties map
 * @returns {@link OverrideProperties} object
 */
const getOverrides = (propertyMap: Map<string, string>): OverrideProperties => {
  const dotSecureFolder = getValue(propertyMap, 'dotSecureFolder')
  const dotCmsFolder = getValue(propertyMap, 'dotCmsFolder')
  const felixFolder = getValue(propertyMap, 'felixFolder')
  const assetsFolder = getValue(propertyMap, 'assetsFolder')
  const resourcesFolder = path.join(dotCmsFolder, 'src/main/resources')
  const itResourcesFolder = path.join(dotCmsFolder, 'src/integration-test/resources')
  const dbType = getValue(propertyMap, 'dbType')

  return {
    files: [
      {
        file: `${dotCmsFolder}/gradle.properties`,
        properties: [
          {
            original: '^# integrationTestFelixFolder=.*$',
            replacement: `integrationTestFelixFolder=${felixFolder}`
          }
        ]
      },
      {
        file: `${resourcesFolder}/dotmarketing-config.properties`,
        properties: [
          {
            original: '^#DYNAMIC_CONTENT_PATH=.*$',
            replacement: `DYNAMIC_CONTENT_PATH=${dotSecureFolder}`
          }
        ]
      },
      {
        file: `${itResourcesFolder}/${dbType}-db-config.properties`,
        properties: [
          {
            original: '://database',
            replacement: '://localhost'
          }
        ]
      },
      {
        file: `${itResourcesFolder}/it-dotcms-config-cluster.properties`,
        properties: [
          {
            original: '^es.path.home=.*$',
            replacement: `es.path.home=${dotCmsFolder}/src/main/webapp/WEB-INF/elasticsearch`
          },
          {
            original: '^ES_HOSTNAME=.*$',
            replacement: 'ES_HOSTNAME=127.0.0.1'
          }
        ]
      },
      {
        file: `${itResourcesFolder}/it-dotmarketing-config.properties`,
        properties: [
          {
            original: '^DYNAMIC_CONTENT_PATH=.*$',
            replacement: `DYNAMIC_CONTENT_PATH=${dotSecureFolder}`
          },
          {
            original: '^TAIL_LOG_LOG_FOLDER=.*$',
            replacement: `TAIL_LOG_LOG_FOLDER=${dotSecureFolder}/logs/`
          },
          {
            original: '^ASSET_REAL_PATH =.*$',
            replacement: `ASSET_REAL_PATH=${assetsFolder}`
          },
          {
            original: '^#TOOLBOX_MANAGER_PATH=.*$',
            replacement: `TOOLBOX_MANAGER_PATH=${dotCmsFolder}/src/main/webapp/WEB-INF/toolbox.xml`
          },
          {
            original: '^VELOCITY_ROOT =.*$',
            replacement: `VELOCITY_ROOT=${dotCmsFolder}/src/main/webapp/WEB-INF/velocity`
          },
          {
            original: '^GEOIP2_CITY_DATABASE_PATH_OVERRIDE=.*$',
            replacement: `GEOIP2_CITY_DATABASE_PATH_OVERRIDE=${dotCmsFolder}/src/main/webapp/WEB-INF/geoip2/GeoLite2-City.mmdb`
          },
          {
            original: '^felix.base.dir=.*$',
            replacement: `felix.base.dir=${felixFolder}`
          }
        ]
      }
    ]
  }
}

/**
 * Get apeend properties object.
 *
 * @param propertyMap properties map
 * @returns {@link AppendProperties} object
 */
const getAppends = (propertyMap: Map<string, string>): AppendProperties => {
  const felixFolder = getValue(propertyMap, 'felixFolder')
  const esDataFolder = getValue(propertyMap, 'esDataFolder')
  const logsFolder = getValue(propertyMap, 'logsFolder')
  const dotCmsFolder = getValue(propertyMap, 'dotCmsFolder')
  const itResourcesFolder = path.join(dotCmsFolder, 'src/integration-test/resources')

  return {
    files: [
      {
        file: `${itResourcesFolder}/it-dotmarketing-config.properties`,
        lines: [
          `felix.felix.fileinstall.dir=${felixFolder}/load`,
          `felix.felix.undeployed.dir=${felixFolder}/undeploy`,
          'dotcms.concurrent.locks.disable=false'
        ]
      },
      // {
      //   file: `${itResourcesFolder}/it-dotcms-config-cluster.properties`,
      //   lines: ['ES_ENDPOINTS=http://localhost:9200', 'ES_PROTOCOL=http', 'ES_HOSTNAME=localhost', 'ES_PORT=9200']
      // },
      {
        file: `${dotCmsFolder}/src/main/webapp/WEB-INF/elasticsearch/config/elasticsearch-override.yml`,
        lines: [
          'cluster.name: dotCMSContentIndex_docker',
          `path.data: ${esDataFolder}`,
          `path.repo: ${esDataFolder}/essnapshot/snapshots`,
          `path.logs: ${logsFolder}`,
          'http.enabled: false',
          'http.cors.enabled: false',
          'cluster.routing.allocation.disk.threshold_enabled: false'
        ]
      }
    ]
  }
}

/**
 * Creates license folder and file with appropiate key.
 */
const prepareLicense = async () => {
  const licensePath = path.join(worskpaceFolder, LICENSE_FOLDER)
  const licenseKey = core.getInput('license_key')
  const licenseFile = path.join(licensePath, 'license.dat')
  core.info(`Adding license to ${licenseFile}`)
  fs.writeFileSync(licenseFile, licenseKey, {encoding: 'utf8', flag: 'a+', mode: 0o777})
  await exec.exec('cat', [licenseFile])
  await exec.exec('ls', ['-las', licenseFile])
}