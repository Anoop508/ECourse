const userModel = require('../models/user.model');
// const foodPartnerModel = require('../models/foodPather.model');
const mongoose = require('mongoose')

const { ObjectId } = mongoose.Types;

async function userList(req, res) {
    const userList = await userModel.find();

    // console.log(userList);
    res.status(200).json({
        userList
    })
}

// async function foodPatnerList(req, res) {
//     const foodPartnerList = await foodPartnerModel.find();

//     res.status(200).json({
//         foodPartnerList
//     })
// }

async function updateUserDetails(req, res) {
    const { email } = req.params;

    const { name, gender } = req.body;

    const user = await userModel.findOne({
        email,
    })

    const isUpdated = await userModel.updateOne(
        { email: email },
        {
            $set:
            {
                name: name,
                gender: gender
            }
        }
    )

    if (!user) {
        return res.status(403).json({
            message: 'Email is not exists'
        })
    }

    res.status(200).json({
        message: isUpdated?.modifiedCount >= 1 ? "User Detals updated Succcessfully." : "Please Update the Data then Click on Submit."
    })
}


// const updatefoodPatnerDetails = async (req, res) => {
//     const { email } = req.params;

//     const { name, gender, address, contactNumber } = req.body;

//     const user = await foodPartnerModel.findOne({
//         email
//     })

//     if (!user) {
//         return res.status(403).json({
//             message: 'Email id not exists'
//         })
//     }

//     const updatedataRes = await foodPartnerModel.updateOne(
//         { email: email },
//         {
//             $set: {
//                 name: name,
//                 gender: gender,
//                 address: address,
//                 contactNumber: contactNumber
//             }
//         }
//     )

//     res.status(200).json({
//         // updatedataRes
//         message: updatedataRes.modifiedCount >= 1 ? "Food Partner Detals Updated Succcessfully." : "Please Update the data then Click on Submit."
//     })


// }

const sendEmailforUserDetailsAppoval = async (req, res) => {

    const { email } = req.params;
    const { name, gender } = req.body;

    var params = {
        Destination: {
            /* required */
            // CcAddresses: [
            //     "EMAIL_ADDRESS",
            //     /* more items */
            // ],
            ToAddresses: [
                'ag9453406828@gmail.com',
                /* more items */
            ],
        },
        Template: "Approval_User_updated_details_Email" /* required */,
        TemplateData: JSON.stringify({ name: name, gender: gender }) /* required */,
        // Message: {
        //     /* required */
        //     Body: {
        //         /* required */
        //         // Html: {
        //         //     Charset: "UTF-8",
        //         //     Data: "HTML_FORMAT_BODY",
        //         // },
        //         // Text: {
        //         //     Charset: "UTF-8",
        //         //     Data: `I have changed my respective details, please approve this
        //         //      Name: ${name}
        //         //      Gender: ${gender}
        //         //     `,
        //         // },
        //     },
        //     Subject: {
        //         Charset: "UTF-8",
        //         Data: "Request for approval of My updated details",
        //     },
        // },
        Source: email /* required */,
        // ReplyToAddresses: [
        //     "EMAIL_ADDRESS",
        //     /* more items */
        // ],
    };

    var sendPromise = new AWS.SES({ apiVersion: "2010-12-01" })
        .sendTemplatedEmail(params)
        .promise();

    // Handle promise's fulfilled/rejected states
    sendPromise
        .then(function (data) {
            return res.status(200).json({
                message: 'Email Send Successfully'
            })
            // console.log(data.MessageId);
        })
        .catch(function (err) {
            return res.status(500).json({
                message: `Getting Some error ${err}`
            })
            // console.error(err, err.stack);
        });

}


module.exports = { userList, updateUserDetails, sendEmailforUserDetailsAppoval };