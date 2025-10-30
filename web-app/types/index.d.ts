declare global {
  namespace API {
    export type CurrentUser = {
      name: string;
      avatar: string;
      userid: string;
      email: string;
      signature: string;
      title: string;
      group: string;
      tags: {
        key: string;
        label: string;
      }[];
      notifyCount: number;
      unreadCount: number;
      country: string;
      geographic: {
        province: {
          label: string;
          key: string;
        };
        city: {
          label: string;
          key: string;
        };
      };
      address: string;
      phone: string;
    };

    export type RuleListItem = {
      key: number;
      disabled: boolean;
      href: string;
      avatar: string;
      name: string;
      owner: string;
      desc: string;
      callNo: number;
      status: string;
      updatedAt: string;
      createdAt: string;
      progress: number;
    };
  }
}

export {};
