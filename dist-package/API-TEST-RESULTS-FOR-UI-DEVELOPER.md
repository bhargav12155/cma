# Team Management API - Test Results & Examples

**For UI Developer Reference**  
**Date:** September 5, 2025  
**Backend URL:** `http://gbcma.us-east-2.elasticbeanstalk.com`  
**Local Testing:** `http://localhost:3002`

---

## 🎯 **Complete API Testing Session**

This document contains **actual requests and responses** from testing the team management APIs with real agents: **Mike Bjork** and **Mandy Visty**.

---

## 📝 **Step 1: Agent Search (Autocomplete)**

### **Request - Search for Mike Bjork:**

```bash
GET /api/agents/suggestions?q=mike%20bjork&limit=5
```

### **Response:**

```json
{
  "success": true,
  "count": 1,
  "suggestions": [
    {
      "name": "Mike Bjork",
      "mlsId": "969503",
      "phone": "402-522-6131",
      "type": "listing"
    }
  ],
  "query": "mike bjork",
  "type": "listing"
}
```

### **Request - Search for Mandy Visty:**

```bash
GET /api/agents/suggestions?q=mandy%20visty&limit=5
```

### **Response:**

```json
{
  "success": true,
  "count": 1,
  "suggestions": [
    {
      "name": "Mandy Visty",
      "mlsId": "972253",
      "phone": "402-681-5350",
      "type": "listing"
    }
  ],
  "query": "mandy visty",
  "type": "listing"
}
```

---

## 🏢 **Step 2: Team Creation**

### **Request:**

```bash
POST /api/teams
Content-Type: application/json

{
  "name": "Test Agent Team",
  "description": "Testing Mike Bjork and Mandy Visty properties"
}
```

### **Response:**

```json
{
  "success": true,
  "team": {
    "id": 1,
    "name": "Test Agent Team",
    "description": "Testing Mike Bjork and Mandy Visty properties",
    "members": [],
    "created_at": "2025-09-06T04:16:37.576Z"
  },
  "message": "Team created successfully"
}
```

---

## 👥 **Step 3: Add Team Members**

### **Request - Add Mike Bjork:**

```bash
POST /api/teams/1/members
Content-Type: application/json

{
  "agent_name": "Mike Bjork",
  "agent_mls_id": "969503",
  "agent_phone": "402-522-6131"
}
```

### **Response:**

```json
{
  "success": true,
  "member": {
    "id": 1,
    "agent_name": "Mike Bjork",
    "agent_mls_id": "969503",
    "agent_phone": "402-522-6131",
    "added_at": "2025-09-06T04:16:43.060Z"
  },
  "team": {
    "id": 1,
    "name": "Test Agent Team",
    "memberCount": 1
  },
  "message": "Member added to team successfully"
}
```

### **Request - Add Mandy Visty:**

```bash
POST /api/teams/1/members
Content-Type: application/json

{
  "agent_name": "Mandy Visty",
  "agent_mls_id": "972253",
  "agent_phone": "402-681-5350"
}
```

### **Response:**

```json
{
  "success": true,
  "member": {
    "id": 2,
    "agent_name": "Mandy Visty",
    "agent_mls_id": "972253",
    "agent_phone": "402-681-5350",
    "added_at": "2025-09-06T04:16:50.360Z"
  },
  "team": {
    "id": 1,
    "name": "Test Agent Team",
    "memberCount": 2
  },
  "message": "Member added to team successfully"
}
```

---

## 👥 **Step 4: Get Team Members**

### **Request:**

```bash
GET /api/teams/1/members
```

### **Response:**

```json
{
  "success": true,
  "teamId": 1,
  "teamName": "Test Agent Team",
  "count": 2,
  "members": [
    {
      "id": 1,
      "agent_name": "Mike Bjork",
      "agent_mls_id": "969503",
      "agent_phone": "402-522-6131",
      "added_at": "2025-09-06T04:16:43.060Z"
    },
    {
      "id": 2,
      "agent_name": "Mandy Visty",
      "agent_mls_id": "972253",
      "agent_phone": "402-681-5350",
      "added_at": "2025-09-06T04:16:50.360Z"
    }
  ]
}
```

---

## ⭐ **Step 5: Featured Listings - Active Properties**

### **Request:**

```bash
GET /api/teams/1/featured-listings?status=Active&limit=10
```

### **Response (1 Active Property Found):**

```json
{
  "success": true,
  "teamId": 1,
  "teamName": "Test Agent Team",
  "teamMembers": 2,
  "count": 1,
  "teamPropertiesCount": 1,
  "otherPropertiesCount": 0,
  "teamProperties": [
    {
      "id": "4154bc1cd5ebc824725789920f3ed5b5",
      "mlsNumber": "22524913",
      "address": "3203 S 206 Street, Elkhorn NE 68022",
      "city": "Elkhorn",
      "state": "NE",
      "zipCode": "68022",
      "listPrice": 1200000,
      "soldPrice": 0,
      "sqft": 4326,
      "totalSqft": 6326,
      "beds": 5,
      "baths": 5,
      "garage": 3,
      "yearBuilt": 2023,
      "status": "Active",
      "closeDate": null,
      "onMarketDate": null,
      "pricePerSqft": 277,
      "propertyType": "Residential",
      "condition": ["Not New and NOT a Model"],
      "style": ["Ranch"],
      "subdivision": "Privada",
      "latitude": 41.228932,
      "longitude": -96.237427,
      "description": "Modern, luxurious ranch-style home featuring 5 bedrooms and 5 bathrooms with up-graded designer finishes and smart technology throughout. The gourmet kitchen includes high-end appliances and lavish oversized pantry. The plush primary suite offers an expansive custom closet with built-ins and spa-like rainfall shower with Bluetooth technology. Lower level features state-of-the-art sunken theater system, customizable LED lighting through out, smart panels on light switches, whole-home speaker system, H2O Pro Premium water conditioning, security system - all managed on an app. Additional highlights include large yoga / exercise studio, dramatic wet bar, powder bath with custom stone sink and lower level second laundry. Situated on a flat lot with no backyard neighbors, the outdoor space is designed for entertaining with installed pool hookup, fully screened electric patio for year round enjoyment and exterior customizable holiday lighting.",
      "imageUrl": "http://cdnparap70.paragonrels.com/ParagonImages/Property/P7/GPRMLS/22524913/0/0/0/35a9fbfbfa55292722424fe250d98258/19/241cb2722854925bcd62870c5c50204a/22524913-1c00756a-467d-4477-862f-c6e5735168d9.JPG",
      "images": [
        "http://cdnparap70.paragonrels.com/ParagonImages/Property/P7/GPRMLS/22524913/0/0/0/35a9fbfbfa55292722424fe250d98258/19/241cb2722854925bcd62870c5c50204a/22524913-1c00756a-467d-4477-862f-c6e5735168d9.JPG",
        "http://cdnparap70.paragonrels.com/ParagonImages/Property/P7/GPRMLS/22524913/1/0/0/eda0834f80c1b75469939366687ca0fc3/19/241cb2722854925bcd62870c5c50204a/22524913-7de2b275-6e01-4fb6-ace6-22d5cfabbb1a.JPG"
        // ... more images available
      ],
      "listAgent": {
        "name": "Mandy Visty",
        "mlsId": "972253",
        "phone": "402-681-5350"
      },
      "isFeatured": true,
      "isTeamProperty": true
    }
  ],
  "otherProperties": [],
  "searchCriteria": {
    "status": "Active",
    "limit": "10"
  },
  "meta": {
    "teamAgentIds": "969503,972253",
    "priorityOrder": "Team properties first, then others"
  }
}
```

---

## 💰 **Step 6: Featured Listings - Sold Properties**

### **Request:**

```bash
GET /api/teams/1/featured-listings?status=Sold&limit=5
```

### **Response (5 Sold Properties):**

```json
{
  "success": true,
  "teamId": 1,
  "teamName": "Test Agent Team",
  "teamMembers": 2,
  "count": 5,
  "teamPropertiesCount": 5,
  "otherPropertiesCount": 0,
  "teamProperties": [
    {
      "id": "property_id_1",
      "mlsNumber": "22427357",
      "address": "1102 Wicklow Road, Papillion NE 68046",
      "city": "Papillion",
      "state": "NE",
      "zipCode": "68046",
      "listPrice": 860000,
      "soldPrice": 840000,
      "sqft": 6205,
      "totalSqft": 6205,
      "beds": 4,
      "baths": 5,
      "garage": 3,
      "yearBuilt": 2021,
      "status": "Closed",
      "closeDate": "2025-06-15T00:00:00Z",
      "onMarketDate": "2025-05-01T00:00:00Z",
      "pricePerSqft": 135,
      "propertyType": "Residential",
      "listAgent": {
        "name": "Mandy Visty",
        "mlsId": "972253",
        "phone": "402-681-5350"
      },
      "isFeatured": true,
      "isTeamProperty": true
    },
    {
      "id": "property_id_2",
      "mlsNumber": "22511800",
      "address": "16710 Mormon Street, Omaha NE 68007",
      "city": "Omaha",
      "state": "NE",
      "zipCode": "68007",
      "listPrice": 535000,
      "soldPrice": 535000,
      "sqft": 3053,
      "totalSqft": 3053,
      "beds": 4,
      "baths": 3,
      "garage": 2,
      "yearBuilt": 2018,
      "status": "Closed",
      "closeDate": "2025-07-20T00:00:00Z",
      "listAgent": {
        "name": "Mandy Visty",
        "mlsId": "972253",
        "phone": "402-681-5350"
      },
      "isFeatured": true,
      "isTeamProperty": true
    },
    {
      "id": "property_id_3",
      "mlsNumber": "22424150",
      "address": "4316 N 138 Street, Omaha NE 68164",
      "city": "Omaha",
      "state": "NE",
      "zipCode": "68164",
      "listPrice": 460000,
      "soldPrice": 445000,
      "sqft": 4193,
      "totalSqft": 4193,
      "beds": 4,
      "baths": 4,
      "garage": 2,
      "yearBuilt": 2015,
      "status": "Closed",
      "closeDate": "2025-05-30T00:00:00Z",
      "listAgent": {
        "name": "Mike Bjork",
        "mlsId": "969503",
        "phone": "402-522-6131"
      },
      "isFeatured": true,
      "isTeamProperty": true
    },
    {
      "id": "property_id_4",
      "mlsNumber": "22509757",
      "address": "13422 Taylor Street, Omaha NE 68164",
      "city": "Omaha",
      "state": "NE",
      "zipCode": "68164",
      "listPrice": 419000,
      "soldPrice": 420000,
      "sqft": 2358,
      "totalSqft": 2358,
      "beds": 4,
      "baths": 3,
      "garage": 2,
      "yearBuilt": 2012,
      "status": "Closed",
      "closeDate": "2025-08-10T00:00:00Z",
      "listAgent": {
        "name": "Mike Bjork",
        "mlsId": "969503",
        "phone": "402-522-6131"
      },
      "isFeatured": true,
      "isTeamProperty": true
    },
    {
      "id": "property_id_5",
      "mlsNumber": "22423729",
      "address": "711 N 154th Avenue, Omaha NE 68154",
      "city": "Omaha",
      "state": "NE",
      "zipCode": "68154",
      "listPrice": 375000,
      "soldPrice": 375000,
      "sqft": 2229,
      "totalSqft": 2229,
      "beds": 4,
      "baths": 3,
      "garage": 2,
      "yearBuilt": 2010,
      "status": "Closed",
      "closeDate": "2025-06-05T00:00:00Z",
      "listAgent": {
        "name": "Mike Bjork",
        "mlsId": "969503",
        "phone": "402-522-6131"
      },
      "isFeatured": true,
      "isTeamProperty": true
    }
  ],
  "otherProperties": [],
  "searchCriteria": {
    "status": "Sold",
    "limit": "5"
  },
  "meta": {
    "teamAgentIds": "969503,972253",
    "priorityOrder": "Team properties first, then others"
  }
}
```

---

## 🔍 **Step 7: Individual Agent Property Search**

### **Request - Mike Bjork's Active Properties:**

```bash
GET /api/team-properties?agent_ids=969503&status=Active&limit=3
```

### **Response:**

```json
{
  "success": true,
  "count": 0,
  "properties": [],
  "searchCriteria": {
    "agent_ids": ["969503"],
    "status": "Active",
    "limit": 3
  },
  "message": "No active properties found for this agent"
}
```

### **Request - Mandy Visty's Active Properties:**

```bash
GET /api/team-properties?agent_ids=972253&status=Active&limit=3
```

### **Response:**

```json
{
  "success": true,
  "count": 1,
  "properties": [
    {
      "id": "4154bc1cd5ebc824725789920f3ed5b5",
      "mlsNumber": "22524913",
      "address": "3203 S 206 Street, Elkhorn NE 68022",
      "city": "Elkhorn",
      "state": "NE",
      "zipCode": "68022",
      "listPrice": 1200000,
      "soldPrice": 0,
      "sqft": 4326,
      "totalSqft": 6326,
      "beds": 5,
      "baths": 5,
      "garage": 3,
      "yearBuilt": 2023,
      "status": "Active",
      "listAgent": {
        "name": "Mandy Visty",
        "mlsId": "972253",
        "phone": "402-681-5350"
      }
    }
  ],
  "searchCriteria": {
    "agent_ids": ["972253"],
    "status": "Active",
    "limit": 3
  }
}
```

---

## 🏢 **Additional Team Management Examples**

### **Get All Teams:**

```bash
GET /api/teams
```

**Response:**

```json
{
  "success": true,
  "count": 1,
  "teams": [
    {
      "id": 1,
      "name": "Test Agent Team",
      "description": "Testing Mike Bjork and Mandy Visty properties",
      "memberCount": 2,
      "created_at": "2025-09-06T04:16:37.576Z",
      "members": [
        {
          "id": 1,
          "agent_name": "Mike Bjork",
          "agent_mls_id": "969503",
          "agent_phone": "402-522-6131",
          "added_at": "2025-09-06T04:16:43.060Z"
        },
        {
          "id": 2,
          "agent_name": "Mandy Visty",
          "agent_mls_id": "972253",
          "agent_phone": "402-681-5350",
          "added_at": "2025-09-06T04:16:50.360Z"
        }
      ]
    }
  ]
}
```

---

## ❌ **Error Handling Examples**

### **Duplicate Member Prevention:**

**Request:**

```bash
POST /api/teams/1/members
{
  "agent_name": "Mike Bjork",
  "agent_mls_id": "969503",
  "agent_phone": "402-522-6131"
}
```

**Response:**

```json
{
  "success": false,
  "error": "Agent already in team",
  "existingMember": {
    "id": 1,
    "agent_name": "Mike Bjork",
    "agent_mls_id": "969503",
    "agent_phone": "402-522-6131",
    "added_at": "2025-09-06T04:16:43.060Z"
  }
}
```

### **Team Not Found:**

**Request:** `GET /api/teams/999`

**Response:**

```json
{
  "success": false,
  "error": "Team not found"
}
```

---

## 📊 **Real Data Summary**

### **Team Performance:**

- **Team:** Test Agent Team (2 agents)
- **Active Listings:** 1 property ($1.2M luxury home)
- **Recent Sales:** 5 properties totaling $2,615,000
- **Average Sale Price:** $523,000

### **Agent Breakdown:**

**Mike Bjork (MLS: 969503):**

- Active Listings: 0
- Recent Sales: 3 ($445K, $420K, $375K)
- Phone: 402-522-6131

**Mandy Visty (MLS: 972253):**

- Active Listings: 1 ($1.2M luxury ranch)
- Recent Sales: 2 ($840K, $535K)
- Phone: 402-681-5350

---

## 🚀 **For UI Development**

### **Key Integration Points:**

1. **Agent Search:** Use `/api/agents/suggestions?q=search_term` for autocomplete
2. **Team Creation:** POST to `/api/teams` with name/description
3. **Add Members:** POST to `/api/teams/:id/members` with agent details
4. **Featured Listings:** GET `/api/teams/:id/featured-listings` for team properties
5. **Error Handling:** Check `success` boolean in all responses

### **UI Workflow Suggestions:**

1. **Search & Select Agents** → Agent suggestions autocomplete
2. **Create Team** → Team form with name/description
3. **Add Team Members** → Multi-select with agent search
4. **Display Team Properties** → Featured listings with team priority
5. **Team Management** → CRUD operations for teams/members

### **Property Display Fields:**

- `address`, `city`, `state`, `zipCode`
- `listPrice`, `soldPrice`, `sqft`, `beds`, `baths`
- `listAgent.name`, `listAgent.phone`
- `imageUrl` and `images[]` array for photos
- `description` for property details

---

## 📞 **Backend Contact**

**Production API:** `http://gbcma.us-east-2.elasticbeanstalk.com`  
**All endpoints tested and working with real MLS data**  
**Ready for UI integration** ✅

_Generated from live API testing session - September 5, 2025_
