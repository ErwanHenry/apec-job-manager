import { Admin, Resource, ListGuesser, EditGuesser } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';
import CampaignIcon from '@mui/icons-material/Campaign';
import PeopleIcon from '@mui/icons-material/People';
import MessageIcon from '@mui/icons-material/Message';

import Dashboard from './dashboard/Dashboard';
import { CampaignList } from './resources/campaigns/CampaignList';
import { CampaignEdit } from './resources/campaigns/CampaignEdit';
import { CampaignCreate } from './resources/campaigns/CampaignCreate';
import { ProspectList } from './resources/prospects/ProspectList';
import { ProspectEdit } from './resources/prospects/ProspectEdit';
import { ProspectKanban } from './resources/prospects/ProspectKanban';
import { MessageList } from './resources/messages/MessageList';
import { MessageEdit } from './resources/messages/MessageEdit';
import { MessageCreate } from './resources/messages/MessageCreate';

// Data provider - use production API URL or localhost for dev
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const dataProvider = simpleRestProvider(API_URL);

const AdminApp = () => (
  <Admin dataProvider={dataProvider} dashboard={Dashboard}>
    <Resource
      name="campaigns"
      list={CampaignList}
      edit={CampaignEdit}
      create={CampaignCreate}
      icon={CampaignIcon}
      options={{ label: 'Campagnes' }}
    />
    <Resource
      name="prospects"
      list={ProspectList}
      edit={ProspectEdit}
      icon={PeopleIcon}
      options={{ label: 'Prospects' }}
    />
    <Resource
      name="prospects/kanban"
      list={ProspectKanban}
      options={{ label: 'Pipeline Kanban' }}
    />
    <Resource
      name="messages"
      list={MessageList}
      edit={MessageEdit}
      create={MessageCreate}
      icon={MessageIcon}
      options={{ label: 'Messages' }}
    />
  </Admin>
);

export default AdminApp;
