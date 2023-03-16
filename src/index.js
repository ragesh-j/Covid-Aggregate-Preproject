const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const port = 8080

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require('./connector')

app.get("/totalRecovered",async(req,res)=>{
    const Data= await connection.aggregate([{
        $group:{
            _id:"total",
            recovered:{$sum:'$recovered'}
        }
    }])
    res.status(200).send({data:Data[0]})
})

app.get("/totalActive",async(req,res)=>{
    const Data=await connection.aggregate([{
        $group:{
            _id:"total",
            active:{$sum:{$subtract:["$infected","$recovered"]}}
        }
    }])
    res.status(200).json({data:Data[0]})
})

app.get('/totalDeath', async (req, res) => {
    const totalDeath = await connection.aggregate([
      {
        $group: {
          _id: 'total',
          death: { $sum: '$death' }
        }
      }
    ]);
  
    res.json({ data: totalDeath[0] });
  });

  app.get('/hotspotStates', async (req, res) => {
    const hotspotStates = await connection.aggregate([
      {
        $addFields: {
          rate: {
            $round: [
              {
                $divide: [
                  { $subtract: ['$infected', '$recovered'] },
                  '$infected'
                ]
              },
              5
            ]
          }
        }
      },
      {
        $match: {
          rate: { $gt: 0.1 }
        }
      },
      {
        $project: {
          _id: 0,
          state: 1,
          rate: 1
        }
      }
    ]);
  
    res.json({ data: hotspotStates });
  });
  app.get('/healthyStates', async (req, res) => {
    const healthyStates = await connection.aggregate([
      {
        $addFields: {
          mortality: {
            $round: [
              {
                $divide: ['$death', '$infected']
              },
              5
            ]
          }
        }
      },
      {
        $match: {
          mortality: { $lt: 0.005 }
        }
      },
      {
        $project: {
          _id: 0,
          state: 1,
          mortality: 1
        }
      }
    ]);
  
    res.json({ data: healthyStates });
  });

app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app;