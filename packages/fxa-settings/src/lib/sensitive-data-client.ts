import {
  ApolloClient,
  InMemoryCache,
  gql,
  NormalizedCacheObject,
} from '@apollo/client';

export class SensitiveDataClient {
  private client: ApolloClient<NormalizedCacheObject>;

  constructor(gqlUrl: string) {
    this.client = new ApolloClient({
      uri: gqlUrl,
      cache: new InMemoryCache(),
    });
  }

  clearData() {
    this.client.writeQuery({
      query: gql`
        query ClearSensitiveData {
          password
          kB
          email
        }
      `,
      data: {
        password: null,
        kB: null,
        email: null,
      },
    });
  }

  setData(data: SensitiveData) {
    this.client.writeQuery({
      query: gql`
        query SetSensitiveData {
          password
          kB
          email
        }
      `,
      data: {
        password: data.password,
        kB: data.kB,
        email: data.email,
      },
    });
  }

  getData(): SensitiveData | null {
    const { password, kB, email } = this.client.readQuery({
      query: gql`
        query GetSensitiveData {
          password
          kB
          email
        }
      `,
    }) || { password: null, kB: null, email: null };
    return { password, kB, email };
  }
}

interface SensitiveData {
  password?: string;
  kB?: string;
  email?: string;
}
