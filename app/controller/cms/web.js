'use strict';
const Controller = require('../../core/base_controller');
const { Op } = require('sequelize');
// cms web前台
class WebController extends Controller {
  constructor(ctx) {
    super(ctx);
    ctx.userInfo = ctx.helper.deToken(ctx.session.mcToken);
    this.app.nunjucks.addFilter('@cms_list', async (m, callback) => {
      // console.log(m);
      const user = await ctx.model.SysUser.findOne();
      // console.log(user);
      const html = await ctx.renderString('<h1>hi, {{ user.username }}</h1>', { user });
      callback(null, html);
    }, true);
    // 分类标签 {{'cid'|@classify(type)}}
    // type等于 top 获取当前栏目最顶级父栏目下所有的子栏目
    // type等于 sub 获取当前栏目的子分类
    this.app.nunjucks.addFilter('@classify', async (cid, type, callback) => {
      if (type === 'top') {
        // console.log(cid);
        const topid = await ctx.service.cms.classify.getTopId(cid);
        // console.log(topid);
        const ids = await ctx.service.cms.classify.getSubClassifyIds(topid);
        // console.log(ids);
        const classifyList = (await ctx.model.CmsClassify.findAll({ where: { id: { [Op.in]: ids }, status: true } })).map(item => item.toJSON());
        let topclass = {};
        for (const v of classifyList) {
          v.url = `/cms/list/${v.name ? v.name : v.id}`;
          if (v.id === topid) {
            v.title = '全部分类';
            topclass = v;
          }
        }
        const tree = ctx.helper.arr_to_tree(classifyList, topid);
        // console.log(JSON.stringify(tree, null, 2));
        callback(null, tree.length > 0 ? [ topclass, ...tree ] : null);
      } else if (type === 'sub') {
        const { sub } = ctx.query;
        // console.log(sub);
        const subobj = {};
        if (sub) {
          const str = sub.split('|');
          // console.log(str);
          for (const v of str) {
            const strarr = v.split('-');
            subobj[strarr[0]] = strarr[1].split(',');
          }
        }
        // console.log(subobj);
        const classify = await ctx.model.CmsClassify.findOne({ where: { id: cid } });
        // console.log(classify);
        const res = [];
        if (classify.sub) {
          const sub = JSON.parse(classify.sub);
          for (const v of sub) {
            const obj = {};
            obj.label = v.label;
            obj.url = `/cms/list/${classify.name ? classify.name : classify.id}`;
            obj.name = `${v.name}${classify.id}`;
            obj.type = v.type;
            // console.log(subobj[obj.name]);
            obj.options = [];
            for (const key in v.options) {
              const o = {};
              o.label = key;
              o.value = v.options[key];
              o.check = subobj[obj.name] ? subobj[obj.name].includes(v.options[key]) : false;
              obj.options.push(o);
            }
            res.push(obj);
          }
          // console.log(sub)
        }
        // console.log(JSON.stringify(res, null, 2));
        callback(null, res);
      }

    }, true);

  }
  // 首页
  async index() {
    const { ctx } = this;
    ctx.meta_title = '首页';
    ctx.keywords = this.config.cms.keywords;
    ctx.description = this.config.cms.description;
    // await ctx.service.sys.generate.graphqlAll();
    const temp = await this.ctx.model.CmsTemplate.findOne({ where: { isu: true } });
    const tempinfo = await this.ctx.model.CmsTemplateList.findOne({ where: { isu: true, template_uuid: temp.uuid } });
    await ctx.render(`cms/${temp.path}-${temp.uuid}/index_${tempinfo.name}.html`);
  }
  // 列表
  async list() {
    const { ctx } = this;
    const templatePath = await this.cmsTemplatePath();
    const { id } = ctx.params;
    const query = ctx.query;
    const isnum = ctx.helper.isStringNumber(id);
    const idKey = isnum ? 'id' : 'name';
    const classify = await ctx.model.CmsClassify.findOne({ where: { [idKey]: { [Op.eq]: id } } });
    if (!classify) return await ctx.render(`cms/${templatePath}/inc_404`);
    // SEO
    ctx.meta_title = classify.meta_title || classify.title;
    ctx.keywords = classify.keywords;
    ctx.description = classify.description;
    classify.url = `/cms/list/${classify.name ? classify.name : classify.id}`;
    // 面包屑
    const breadcrumb = await ctx.service.cms.classify.breadcrumb(classify.id);
    // const models = await ctx.model.SysModels.findOne({ where: { uuid: classify.models_uuid } });
    const orderby = query.orderby || '1';
    const map = {};
    const page = query.page || 1;
    const limit = 10;
    map.offset = (Number(page) - 1) * limit;
    map.limit = Number(limit);
    if (orderby === '1') {
      map.order = [[ 'level', 'DESC' ], [ 'id', 'DESC' ]];
    } else if (orderby === '2') {
      map.order = [[ 'updatedAt', 'DESC' ]];
    } else if (orderby === '3') {
      map.order = [[ 'view', 'DESC' ]];
    } else if (orderby === '4') {
      map.order = [[ 'view', 'ASC' ]];
    }
    map.where = {};
    const subobj = {};
    if (query.sub) {
      const str = query.sub.split('|');
      map.where.classify_sub = {};
      for (const v of str) {
        const strarr = v.split('-');
        subobj[strarr[0]] = strarr[1];
      }
      map.where.classify_sub = await ctx.service.cms.classify.subQuery(classify.id, subobj);
    }
    if (query.keywords) {
      map.where.title = { [Op.like]: `%${query.keywords}%` };
    }
    // console.log(map.where)
    map.where.status = true;
    const ids = await ctx.service.cms.classify.getSubClassifyIds(classify.id);
    map.where.classify_id = { [Op.in]: ids };
    const list = await ctx.model.CmsDoc.findAndCountAll(map);
    const pagination = ctx.service.sys.pagination.pagination(list, { limit });
    // console.log(pagination);
    for (const v of list.rows) {
      v.pathTitle = (await ctx.service.cms.classify.info(v.classify_id)).pathTitle;
    }
    let temp;
    // 查询栏目有没有绑定模板
    if (classify.template_lists) {
      temp = `cms/${templatePath}/${classify.template_lists}`;
    } else {
      temp = `cms/${templatePath}/list_default.html`;
    }
    const url = await ctx.service.cms.classify.getUrl(classify.url);
    const orderList = [
      { name: '默认排序', url: url.replace('__ORDER__', 1), id: '1' },
      { name: '按更新时间', url: url.replace('__ORDER__', 2), id: '2' },
      { name: '浏览量:从高到低', url: url.replace('__ORDER__', 3), id: '3' },
      { name: '浏览量:从低到高', url: url.replace('__ORDER__', 4), id: '4' },
    ];
    const def = orderList.find(item => item.id === orderby);
    await ctx.render(temp, { list, pagination, classify, orderby: { list: orderList, def }, breadcrumb });
  }
  // 详情
  async detail() {
    const { ctx } = this;
    const templatePath = await this.cmsTemplatePath();
    const { id } = ctx.params;
    if (!id) return this.notFound();
    const map = {};
    map.include = [{
      model: ctx.model.CmsClassify,
    }];
    map.where = {};
    map.where.id = { [Op.eq]: id };
    const detail = await ctx.model.CmsDoc.findOne(map);
    if (!detail) return await ctx.render(`cms/${templatePath}/inc_404`);
    const info = detail.toJSON();
    // SEO
    ctx.meta_title = info.title;
    ctx.keywords = info.title;
    ctx.description = info.description;
    // 跳转外部连连
    if (info.ext_link) {
      return ctx.redirect(info.ext_link);
    }
    // 面包屑
    const breadcrumb = await ctx.service.cms.classify.breadcrumb(info.classify_id);
    const pdoc = await ctx.service.cms.doc.pdoc(info.pid);
    const pdocids = pdoc.map(item => item.id);
    // console.log('fdsafsadfas', pdoc, pdocids);
    const models = await ctx.model.SysModels.findOne({ where: { uuid: info.models_uuid } });
    const className = ctx.helper._.upperFirst(ctx.helper._.camelCase(models.name));
    info[models.name] = (await ctx.model[className].findOne({ where: { doc_id: info.id } })).toJSON();
    // console.log(JSON.stringify(info, null, 2));
    let temp;
    // 查询栏目有没有绑定模板
    if (info.template) {
      temp = `cms/${templatePath}/${info.template}`;
    } else if (info.cms_classify.template_detail) {
      temp = `cms/${templatePath}/${info.cms_classify.template_detail}`;
    } else {
      temp = `cms/${templatePath}/detail_default.html`;
    }
    info.classify_url = `/cms/list/${info.cms_classify.name ? info.cms_classify.name : info.cms_classify.id}`;
    // 增加浏览次数
    await ctx.model.CmsDoc.increment({ view: 1 }, { where: { id } });
    await ctx.render(temp, { detail: info, breadcrumb, pdoc, pdocids });
  }
}
module.exports = WebController;
