const { oneLine } = require('common-tags');
const permissions = require('../utils/permissions.json');

/**
 * Calypso's custom Command class
 */
class Command {

  /**
   * Create new command
   * @param {Client} client 
   * @param {Object} options 
   */
  constructor(client, options) {

    // Validate all options passed
    this.constructor.validateOptions(client, options);

    /**
     * The client
     * @type {Client}
     */
    this.client = client;

    /**
     * Name of the command
     * @type {string}
     */
    this.name = options.name;

    /**
     * Aliases of the command
     * @type {Array<string>}
     */
    this.aliases = options.aliases || null;

    /**
     * The arguments for the command
     * @type {string}
     */
    this.usage = options.usage || '';

    /**
     * The description for the command
     * @type {string}
     */
    this.description = options.description || '';

    /**
     * The type of command
     * @type {string}
     */
    this.type = options.type || 'general';

    /**
     * The client permissions needed
     * @type {Array<string>}
     */
    this.clientPermissions = options.clientPermissions || ['SEND_MESSAGES'];

    /**
     * The user permissions needed
     * @type {Array<string>}
     */
    this.userPermssions = options.userPermissions || null;
    
    /**
     * If command can only be used by owner
     * @type {boolean}
     */
    this.ownerOnly = options.ownerOnly || false;
  }

  /**
   * Runs the command
   * @param {Message} message 
   * @param {string[]} args 
   */
  run(message, args) {
    throw new Error(`${this.constructor.name} has no run() method`);
  }

  /**
   * Helper method to check permissions
   * @param {Message} message 
   * @param {boolean} ownerOverride 
   */
  checkPermissions(message, ownerOverride = true) {
    // First check user permissions
    let result = this.checkUserPermissions(message, ownerOverride);
    if (result !== true) return result;
    // If passed, then check client permissions
    else return this.checkClientPermissions(message);
  }

  /**
   * Checks the user permissions
   * @param {Message} message 
   * @param {boolean} ownerOverride 
   */
  checkUserPermissions(message, ownerOverride = true) {
    if (!this.ownerOnly && !this.userPermssions) return true;
    if (ownerOverride && this.client.isOwner(message.author)) return true;
    if (this.ownerOnly && !this.client.isOwner(message.author))
      return `The \`${this.name}\` command can only be used by my owner.`;
    
    let missingPermissions=  [];
    if (this.userPermssions) {
      missingPermissions = message.channel.permissionsFor(message.author).missing(this.userPermssions);
      if (missingPermissions.length !== 0) 
        return oneLine`
          The \`${this.name}\` command requires you to have the following permissions: 
          \`${missingPermissions.join(', ')}\`.
        `;
    }
    return true;
  }

  /**
   * Checks the client permissions
   * @param {Message} message 
   * @param {boolean} ownerOverride 
   */
  checkClientPermissions(message) {
    let missingPermissions = [];
    this.clientPermissions.forEach(perm => {
      if (message.guild.me.hasPermission(perm)) return true;
      else missingPermissions.push(perm);
    });
    if (missingPermissions.length !== 0) 
      return oneLine`
        The \`${this.name}\` command requires me to have the following permissions: 
        \`${missingPermissions.join(', ')}\`.
      `;
    else return true;
  }

  /**
   * Validates all options provided
   * @param {Client} client 
   * @param {Object} options 
   */
  static validateOptions(client, options) {
    if(!client) throw new Error('No client was found');
    if(typeof options !== 'object') throw new TypeError('Command options is not an Object');
    if(typeof options.name !== 'string') throw new TypeError('Command name is not a string');
    if(options.name !== options.name.toLowerCase()) throw new Error('Command name is not lowercase');
    if(options.aliases && (!Array.isArray(options.aliases) || options.aliases.some(ali => typeof ali !== 'string'))) {
      throw new TypeError('Command aliases is not an Array of strings');
    }
    if(options.aliases && options.aliases.some(ali => ali !== ali.toLowerCase())) {
      throw new RangeError('Command aliases are not lowercase');
    }
    if(options.usage && typeof options.usage !== 'string') throw new TypeError('Command usage is not a string');
    if(options.description && typeof options.description !== 'string') 
      throw new TypeError('Command description is not a string');
    if(options.type && typeof options.type !== 'string') throw new TypeError('Command type is not a string');
    if(options.type && options.type !== options.type.toLowerCase()) throw new Error('Command type is not lowercase');
    if(options.clientPermissions) {
      if(!Array.isArray(options.clientPermissions)) {
        throw new TypeError('Command clientPermissions is not an Array of permission key strings');
      }
      for(const perm of options.clientPermissions) {
        if(!permissions[perm]) throw new RangeError(`Invalid command clientPermission: ${perm}`);
      }
    }
    if(options.userPermissions) {
      if(!Array.isArray(options.userPermissions)) {
        throw new TypeError('Command userPermissions is not an Array of permission key strings');
      }
      for(const perm of options.userPermissions) {
        if(!permissions[perm]) throw new RangeError(`Invalid command userPermission: ${perm}`);
      }
    }
    if(options.ownerOnly && typeof options.ownerOnly !== 'boolean') 
      throw new TypeError('Command ownerOnly is not a boolean');
  }
}

module.exports = Command;