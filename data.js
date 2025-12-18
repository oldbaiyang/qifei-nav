/**
 * 静态书签导航数据
 * 结构说明：
 * - category: 一级分类名称
 * - icon: 一级分类图标
 * - items: 二级分类列表
 *   - name: 二级分类名称
 *   - items: 书签列表
 */
const navData = [
  {
    category: "好数科技",
    id: "wellnkiot",
    icon: "ti ti-star",
    items: [
      {
        name: "常用平台",
        items: [
          {
            title: "芯昇空写卡平台",
            desc: "芯昇空写卡平台",
            url: "https://onesim.xinshengcmiot.cn:18091/login",
            logo: ""
          },
          {
            title: "（三网卡）广东翼卡车联网",
            desc: "（三网卡）广东翼卡车联网",
            url: "https://ecard.e-car.cn/tree-admin/#/multi/multi-manage",
            logo: ""
          },
          {
            title: "电信业务经营许可申请",
            desc: "电信业务经营许可申请",
            url: "https://ucenter.miit.gov.cn/login.jsp?toUrl=https%3A%2F%2Fdxyw.miit.gov.cn%2Fdxxzsp%2Fhorizon%2Fbasics%2FgetBasics.wf",
            logo: ""
          }

        ]
      }
    ]
  },
  {
    category: "开发工具",
    id: "dev-tools",
    icon: "ti ti-code",
    items: [
      {
        name: "编辑器与文档",
        items: [
          {
            title: "VS Code",
            desc: "最流行的代码编辑器",
            url: "https://code.visualstudio.com",
            logo: ""
          },
          {
            title: "DevDocs",
            desc: "全能的API文档查询工具",
            url: "https://devdocs.io",
            logo: ""
          },
          {
            title: "Can I Use",
            desc: "前端兼容性查询",
            url: "https://caniuse.com",
            logo: ""
          }
        ]
      },
      {
        name: "社区与问答",
        items: [
          {
            title: "Stack Overflow",
            desc: "全球最大的程序员问答社区",
            url: "https://stackoverflow.com",
            logo: ""
          }
        ]
      }
    ]
  },
  {
    category: "设计灵感",
    id: "design",
    icon: "ti ti-palette",
    items: [
      {
        name: "灵感社区",
        items: [
          {
            title: "Dribbble",
            desc: "设计师灵感分享社区",
            url: "https://dribbble.com",
            logo: ""
          },
          {
            title: "Behance",
            desc: "Adobe 旗下的创意展示平台",
            url: "https://www.behance.net",
            logo: ""
          }
        ]
      },
      {
        name: "设计工具",
        items: [
          {
            title: "Figma",
            desc: "现在的 UI 设计标准工具",
            url: "https://www.figma.com",
            logo: ""
          }
        ]
      }
    ]
  },
  {
    category: "学习资源",
    id: "learning",
    icon: "ti ti-book",
    items: [
      {
        name: "Web 开发",
        items: [
          {
            title: "MDN Web Docs",
            desc: "权威的前端开发文档",
            url: "https://developer.mozilla.org",
            logo: ""
          },
          {
            title: "FreeCodeCamp",
            desc: "免费学习编程的社区",
            url: "https://www.freecodecamp.org",
            logo: ""
          }
        ]
      }
    ]
  }
];
