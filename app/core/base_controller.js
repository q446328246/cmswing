'use strict';
const { Controller } = require('egg');
const { Op } = require('sequelize');
class BaseController extends Controller {
  constructor(ctx) {
    super(ctx);
    const { Sequelize } = this.app;
    // cms模板路径 {{'cms'|@template('path')}}
    this.app.nunjucks.addFilter('@template', async (m, n, callback) => {
      let res = '';
      if (m === 'cms') {
        const temp = await this.ctx.model.CmsTemplate.findOne({ where: { isu: true } });
        if (n === 'path') {
          res = `${temp.path}-${temp.uuid}`;
        } else {
          res = temp[n] ? temp[n] : '';
        }
      }
      callback(null, res);
    }, true);

    // findAll {{'mdoel'|@findOne('{where:{a:1}}')}}
    this.app.nunjucks.addFilter('@findOne', async (model, map, callback) => {
      try {
        const modelName = ctx.helper._.upperFirst(ctx.helper._.camelCase(model));
        // Sequelize.where(Sequelize.fn('FIND_IN_SET', v, Sequelize.col('position')), '>', 0)
        // console.log('dfsafdsafdsafdsafasfas', modelName, map);
        if (map.where) {
          for (const key in map.where) {
            if (Object.hasOwnProperty.call(map.where, key)) {
              if (key === 'FIND_IN_SET') {
                map.where.op_and = [];
                map.where.op_and.push(Sequelize.where(Sequelize.fn('FIND_IN_SET', map.where.FIND_IN_SET[1], Sequelize.col(map.where.FIND_IN_SET[0])), '>', 0));
                delete map.where.FIND_IN_SET;
              }
            }
          }
        }
        map.raw = true;
        const res = await ctx.model[modelName].findOne(map);
        callback(null, res);
      } catch (error) {
        ctx.logger.warn(error);
        callback(null, {});
      }

    }, true);
    // findAll {{'mdoel'|@findAll('{where:{a:1}}')}}
    this.app.nunjucks.addFilter('@findAll', async (model, map, callback) => {
      try {
        const modelName = ctx.helper._.upperFirst(ctx.helper._.camelCase(model));
        // Sequelize.where(Sequelize.fn('FIND_IN_SET', v, Sequelize.col('position')), '>', 0)
        // console.log('dfsafdsafdsafdsafasfas', modelName, map);
        if (map.where) {
          for (const key in map.where) {
            if (Object.hasOwnProperty.call(map.where, key)) {
              if (key === 'FIND_IN_SET') {
                map.where.op_and = [];
                map.where.op_and.push(Sequelize.where(Sequelize.fn('FIND_IN_SET', map.where.FIND_IN_SET[1], Sequelize.col(map.where.FIND_IN_SET[0])), '>', 0));
                delete map.where.FIND_IN_SET;
              }
            }
          }
        }
        map.raw = true;
        const res = await ctx.model[modelName].findAll(map);
        callback(null, res);
      } catch (error) {
        ctx.logger.warn(error);
        callback(null, []);
      }

    }, true);

    // 系统导航标签 {{'header'|@navigation}} header/footer
    this.app.nunjucks.addFilter('@navigation', async (m = 'header', callback) => {
      // console.log(m);
      // if (m !== 'sys') return [];
      const map = {};
      map.order = [[ 'sort', 'ASC' ], [ 'id', 'ASC' ]];
      map.where = {};
      map.where.type = m;
      map.status = true;
      const list = (await ctx.model.SysNavigation.findAll(map)).map(item => item.toJSON());
      const tree = ctx.helper.arr_to_tree(list, 0);
      callback(null, tree);
    }, true);
    // mc 菜单 {{ctx.userInfo.uuid|@mc_menu}}
    this.app.nunjucks.addFilter('@mc_menu', async (uuid, callback) => {
      const map = {};
      map.order = [[ 'sort', 'ASC' ]];
      map.where = { is_menu: true, class_uuid: '1cfc8cb1-ca26-4d5e-8499-cc0222bbc4c9' };
      // const roleIds = await this.ctx.service.sys.rbac.getRoleIds(this.ctx.userInfo.uuid);
      // if (!this.ctx.helper._.isEmpty(roleIds)) {
      //   map.where.uuid = { [Op.in]: roleIds };
      // }
      const ml = (await ctx.model.SysRoutes.findAll(map)).map(item => item.toJSON());
      const tree = ctx.helper.arr_to_tree(ml, '0', 'uuid', 'puuid');
      callback(null, tree);
    }, true);
  }
  get user() {
    return this.ctx.userInfo;
  }

  success(data, msg = '操作成功') {
    this.ctx.body = {
      status: 0,
      msg,
      data,
    };
  }
  fail(msg, status = 1000, data) {
    this.ctx.body = {
      status,
      msg,
      data,
    };
  }
  notFound(msg) {
    msg = msg || 'not found';
    this.ctx.throw(404, msg);
  }
  async cmsTemplatePath() {
    const temp = await this.ctx.model.CmsTemplate.findOne({ where: { isu: { [Op.eq]: true } } });
    return `${temp.path}-${temp.uuid}`;
  }
}
module.exports = BaseController;
