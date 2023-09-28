import { fetchUtils } from "react-admin";
import { stringify } from "query-string";
import { alert } from "react";

const apiUrl = "https://sheetdb.io/api/v1";
const httpClient = fetchUtils.fetchJson; //to make http calls
var url = ``;

const TABLE_TYPE = {
  list: "4eiftnfs9jq5a",
  list_item: "p5sudy4eacfmj",
};

export const SheetDbDataProvider = {
  // get a list of records based on sort, filter, and pagination
  getList: (resource, params) => {
    const { page, perPage } = params.pagination; //page and perPage are extracted from params.pagination
    const { field, order } = params.sort;
    const query = {
      sort_by: field,
      sort_order: order,
      limit: perPage,
      offset: (page - 1) * perPage, //for pagination
    };

    var countUrl = `${apiUrl}/${TABLE_TYPE[resource]}/count`; //url for the number of rows
    var totalRows = 0;

    url = `${apiUrl}/${TABLE_TYPE[resource]}?${stringify(query)}`; //main url

    //make a request to get row count and assign it to totalRows
    return httpClient(countUrl)
      .then(({ json }) => (totalRows = json.rows))
      .then(() => httpClient(url)) //make a request to retrieve data from the API
      .then(({ json }) => ({ data: json, total: totalRows })) //object with data:the data retrieved by the API, total: the total number of rows
      .catch((e) => {
        alert(e); //error handling
      });
  },

  // get a single record by id
  getOne: (resource, params) => {
    return httpClient(
      //make a request to find a row, searching by the id
      `${apiUrl}/${TABLE_TYPE[resource]}/search?id=${params.id}`
    ).then(({ json }) => ({
      data: { id: json.id },
    }));
  },

  // get a list of records based on an array of ids
  getMany: (resource, params) => {
    const query = {
      filter: { id: params.ids }, //filters by ids
    };

    url = `${apiUrl}/${TABLE_TYPE[resource]}?${stringify(query)}`;

    return httpClient(url).then(({ json }) => ({ data: json }));
  },

  // get the records referenced to another record
  getManyReference: (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const query = {
      [params.target]: params.id,
      sort_by: field,
      sort_order: order,
      offset: (page - 1) * perPage,
    };
    var countUrl = `${apiUrl}/${TABLE_TYPE[resource]}/count`;
    var totalRows = 0;

    url = `${apiUrl}/${TABLE_TYPE[resource]}?${stringify(query)}`;

    return httpClient(countUrl)
      .then(({ json }) => (totalRows = json.rows))
      .then(() => httpClient(url))
      .then(({ json }) => ({ data: json, total: totalRows }))
      .catch((e) => {
        alert(e);
      });
  },

  update: (resource, params) => {
    //make a request which contains the PUT method and the body which contains the data to be updated
    return httpClient(`${apiUrl}/${TABLE_TYPE[resource]}/id/${params.id}`, {
      method: "PUT",
      body: JSON.stringify(params.data),
    }).then(({ json }) => ({ data: { ...params.data, id: json.id } })); //response in the form of a json key object representing the updated resource
  },

  updateMany: (resource, params) => {
    const query = {
      filter: JSON.stringify({ id: params.ids }),
    };
    return httpClient(`${apiUrl}/${TABLE_TYPE[resource]}?${stringify(query)}`, {
      method: "PUT",
      body: JSON.stringify(params.data),
    }).then(({ json }) => ({ data: json }));
  },

  create: (resource, params) => {
    const { data } = params;
    return httpClient(`${apiUrl}/${TABLE_TYPE[resource]}`, {
      method: "POST",
      body: JSON.stringify({
        data: [
          {
            id: "INCREMENT",
            ...data,
          },
        ],
      }),
    }).then(({ json }) => ({
      data: { id: json.id, ...params.data },
    }));
  },

  delete: (resource, params) => {
    const { id } = params;

    return httpClient(`${apiUrl}/${TABLE_TYPE[resource]}/id/${id}`, {
      method: "DELETE",
    });
  },

  deleteMany: (resource, params) => {
    const { ids } = params;

    const idsUrl = ids.join(",");

    return httpClient(`${apiUrl}/${TABLE_TYPE[resource]}/id/[${idsUrl}]`, {
      method: "DELETE",
    }).then(({ json }) => ({ data: [json] }));
  },
};

export default SheetDbDataProvider;
