import { verifyWebhook } from '@clerk/express/webhooks';
import { Request, Response } from 'express';
import { prisma } from '../configs/prisma.js';
import * as Sentry from "@sentry/node"

const clerkWebhooks = async (req: Request, res: Response) => {
    try {
        const evt: any = await verifyWebhook(req);
        
        // Getting Data from request
        const { data, type } = evt;

        // Switch Cases for different events
        switch (type) {
            case 'user.created':
                await prisma.user.create({
                    data: {
                        id: data.id,
                        email: data?.email_addresses[0]?.email_address,
                        name: data?.first_name + " " + data?.last_name,
                        image: data?.image_url,
                    }
                });
                break;

            case 'user.updated':
                await prisma.user.update({
                    where: {
                        id: data.id
                    },
                    data: {
                        email: data?.email_addresses[0]?.email_address,
                        name: data?.first_name + " " + data?.last_name,
                        image: data?.image_url,
                    }
                });
                break;

            case 'user.deleted':
                await prisma.user.delete({ 
                    where: { id: data.id } 
                });
                break;

            case 'paymentAttempt.updated': // Fixed typo: 'ipdated' → 'updated'
                if ((data.charge_type === 'recurring' || data.charge_type === 'checkout') && data.status === 'paid') {
                    const credits= {
                        pro: 80,
                        premium: 280
                    };
                    const clerkUserId = data?.payer?.user_id;
                    const planId: keyof typeof credits = data?.subscription_items?.[0]?.plan?.slug;
                    if(planId!== 'pro' && planId !=='premium'){
                        return res.status(400).json({message:"Invalid plan"})
                    } 
                    console.log (planId)
                    // Add logic here - what do you want to do with credits?
                    // For example, update user's credits in database
                    await prisma.user.update({
                        where: { id: clerkUserId, }, // Assuming user_id is in data
                        data: {
                            // Add your credits field here
                            // credits: credits[data.plan] or similar logic
                            credits: {increment: credits[planId]}
                        }
                    });
                }
                break;

            default:
                break;
        }
        
        // Send a success response
        res.json({ message: 'Webhook Recieved : ' + type});
        
    } catch (error : any) {
        console.error('Webhook error:', error);
        Sentry.captureException(error)
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

export default clerkWebhooks;