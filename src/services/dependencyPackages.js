import { ayonApi } from './ayon'

const getDependencyPackages = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getDependencyPackageList: build.query({
      query: () => ({
        url: `/api/desktop/dependency_packages`,
      }),
      transformResponse: (res) => res.packages,
      providesTags: () => [{ type: 'dependencyPackageList' }],
    }),
  }), // endpoints
})

export const { useGetDependencyPackageListQuery } = getDependencyPackages