'use strict';
const { Op } = require('sequelize');
if(process)
{
  if(process.env){
    console.log(process.env);
  }
}
module.exports = {
  datasources: [
    {
      dialect: 'mysql',
      host: '172.17.0.2',
      port: 3306,
      database: 'cms',
      username: 'root',
      password: 'Ww3907569.',
      timezone: '+08:00',
      define: {
        freezeTableName: true, // 强制表名称等于模型名称
        underscored: false,
      },
      operatorsAliases: {
        op_eq: Op.eq,
        op_ne: Op.ne,
        op_gte: Op.gte,
        op_gt: Op.gt,
        op_lte: Op.lte,
        op_lt: Op.lt,
        op_not: Op.not,
        op_in: Op.in,
        op_notIn: Op.notIn,
        op_is: Op.is,
        op_like: Op.like,
        op_notLike: Op.notLike,
        op_iLike: Op.iLike,
        op_notILike: Op.notILike,
        op_startsWith: Op.startsWith,
        op_endsWith: Op.endsWith,
        op_substring: Op.substring,
        op_regexp: Op.regexp,
        op_notRegexp: Op.notRegexp,
        op_iRegexp: Op.iRegexp,
        op_notIRegexp: Op.notIRegexp,
        op_between: Op.between,
        op_notBetween: Op.notBetween,
        op_overlap: Op.overlap,
        op_contains: Op.contains,
        op_contained: Op.contained,
        op_adjacent: Op.adjacent,
        op_strictLeft: Op.strictLeft,
        op_strictRight: Op.strictRight,
        op_noExtendRight: Op.noExtendRight,
        op_noExtendLeft: Op.noExtendLeft,
        op_and: Op.and,
        op_or: Op.or,
        op_any: Op.any,
        op_all: Op.all,
        op_values: Op.values,
        op_col: Op.col,
      },
    },
  ],
};
