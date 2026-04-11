import mongoose from 'mongoose'

const productGroupSchema = new mongoose.Schema({
    name: String,
    description: String,
    products: [String]
})

const storeSettingsSchema = new mongoose.Schema({
    announcementBar: [String],
    heroBanners: {
        type: [{ desktopImg: String, mobileImg: String, link: String }],
        default: []
    },
    productGroup1: productGroupSchema,
    productGroup2: productGroupSchema,
    browseByCategory: {
        category1: {
            categoryName: String,
            categoryImage: String
        },
        category2: {
            categoryName: String,
            categoryImage: String
        },
        category3: {
            categoryName: String,
            categoryImage: String
        },
        category4: {
            categoryName: String,
            categoryImage: String
        },
        category5: {
            categoryName: String,
            categoryImage: String
        }
    },
    testimonials: {
        type: {
            testimonialSectionHeading: String,
            testimonialSectionDescription: String,
            reviews: [{
                customerName: String,
                customerProfile: String,
                customerMessage: String,
                customerRating: Number
            }]
        }
    }
})

export const StoreSettings = mongoose.models.StoreSettings || mongoose.model('StoreSettings', storeSettingsSchema)