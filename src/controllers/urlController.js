const validUrl = require("valid-url");
const shortId = require("shortid");
const urlModel = require("../models/urlModel");
const validation = require('../util/validation');

const redis = require("redis");
const { promisify } = require("util");
const redisClient = redis.createClient(
  18380,
  "redis-18380.c263.us-east-1-2.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("v2IVQrUzpKMuTpLwALcZiNye9uSo3tSb", function (err) {
  if (err) throw err;
});


redisClient.on('connect',() => {
    console.log('connected to redis successfully!');
})

redisClient.on('error',(error) => {
    console.log('Redis connection error :', error);
})
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

 const isVaildUrl =  /http(s?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



const createUrl = async (req, res) => {
  try {

    // The API base Url endpoint
    const baseUrl = "http://localhost:3000";

    if (!validUrl.isUri(baseUrl)) {
      return res.status(400).json("Invalid Base Url");
    }

    if (!(validation.isValidRequestBody(req.body))) {
      return res.status(400).send({
        status: false,
        message: "Invalid request parameters. Please provide url details",
      });
    }

    // destructure the longUrl from req.body.longUrl
    const { longUrl } = req.body;

    if (!(validation.isVaild(longUrl))) {
      return res.status(400).json({ status: false, msg: "longUrl is required" });
    }
    

    if (isVaildUrl.test(longUrl) ){

     let isUrlUsed = await urlModel.findOne({longUrl});

        if (isUrlUsed) {
       return   res.status(200).json({ status: true, msg: isUrlUsed });
        }
    }
    else {
      return  res.status(400).json({ status: false, msg: "invalid longurl" });
        }

    //if valid, we create the url code
    const urlCode = shortId.generate();


    //join the generated short code the the base url
    const shortUrl = baseUrl + "/" + urlCode.toLowerCase()

    let urlCreated = {
      longUrl,
      shortUrl,
      urlCode,
    };

    let savedData = await urlModel.create(urlCreated);
    await SET_ASYNC(urlCode.toLowerCase(), longUrl)
    res.status(201).json({ status: true, msg: "URL created successfully", data: savedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, msg: error.message });
  }
};



////////////////////////////////////////////////////////////////////////////////////////////



const getUrl = async (req, res) => {
  try {
    let cachedData = await GET_ASYNC(req.params.urlCode.trim().toLowerCase());
      if (cachedData) {
        console.log("data from cache memory")
        res.status(302).redirect(cachedData);
      } 
    const url = await urlModel.findOne({ urlCode: req.params.urlCode });
    if (url) {
      return res.status(302).redirect(url.longUrl);
    } else {
      return res.status(404).json({ status: false, msg: "URL not found" });
    }
  } catch (error) {
    res.status(500).json({ status: false, msg: error.message });
  }
};

module.exports.getUrl = getUrl;
module.exports.createUrl = createUrl;




//////////////////////////////////////////////////////////////////////////////////////////////


       


