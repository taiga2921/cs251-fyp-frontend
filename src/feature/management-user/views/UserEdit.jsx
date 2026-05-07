import { useParams } from 'react-router-dom';
import { Box, Grid, Fade } from '@mui/material';
import { IconUsers as UsersIcon } from '@tabler/icons-react';

import DetailCard from 'ui-component/cards/DetailCard';
import { FieldContainer } from 'ui-component/FieldContainer';
import { SubmitButton } from 'ui-component/CreateActionButtons';
import { SuccessDialog } from 'ui-component/dialogs/SuccessDialog';
import { SelectFieldContainer } from 'ui-component/SelectFieldContainer';
import { SectionHeader } from 'ui-component/SectionHeader';

import { UserRepository } from '../repositories/userRepository';
import userService from '../datasources/userService';
import { useUserFormController } from '../controllers/useUserFormController';

import { UserAddProfile } from '../components/user-add/UserAddProfile';

const ROLE_OPTIONS = [
   { value: 'admin', label: 'Administrator', icon: '👨‍💼' },
   { value: 'operator', label: 'Operator', icon: '⚙️' },
   { value: 'guard', label: 'Guard', icon: '🛡️' }
];

export default function UserAdd() {
   const { userId } = useParams();
   const repository = new UserRepository(userService);
   const controller = useUserFormController(repository, userId);

   return (
      <>
         <DetailCard title="Edit User Details" avatar={<UsersIcon size={24} />} onBack={controller.handleCancel}>
            <Box sx={{ mx: 'auto' }} component="form" onSubmit={controller.handleSubmit}>
               {/* Profile Picture Section */}
               {/* <UserAddProfile controller={controller} /> */}

               <Grid container spacing={3}>
                  {/* Personal Information */}
                  <Grid size={{ xs: 12, md: 6 }}>
                     <Fade in timeout={1000}>
                        <Box>
                           <SectionHeader title="Personal Information"></SectionHeader>
                        </Box>
                     </Fade>

                     <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 12 }}>
                           <Box>
                              <FieldContainer
                                 label="Full Name"
                                 name="full_name"
                                 value={controller.formData.full_name}
                                 onChange={controller.handleChange('full_name')}
                                 error={!!controller.errors.full_name}
                                 helperText={controller.errors.full_name}
                                 placeholder="Enter full name"
                              ></FieldContainer>
                           </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 12 }}>
                           <Box>
                              <FieldContainer
                                 label="Username"
                                 name="username"
                                 value={controller.formData.username}
                                 onChange={controller.handleChange('username')}
                                 error={!!controller.errors.username}
                                 helperText={controller.errors.username}
                                 placeholder="Enter username"
                              ></FieldContainer>
                           </Box>
                        </Grid>
                     </Grid>
                  </Grid>

                  {/* Role & Permissions */}
                  <Grid size={{ xs: 12, md: 6 }}>
                     <Box>
                        <SectionHeader title="Role & Permissions"></SectionHeader>

                        <SelectFieldContainer
                           label="User Role"
                           name="role"
                           value={controller.formData.role}
                           onChange={controller.handleChange('role')}
                           error={!!controller.errors.role}
                           helperText={controller.errors.role || 'Select the appropriate role'}
                           options={ROLE_OPTIONS}
                           placeholder="Select a role"
                        />
                     </Box>
                  </Grid>

                  {/* Contact Details */}
                  <Grid size={{ xs: 12, md: 12 }}>
                     <Fade in timeout={1000}>
                        <Box>
                           <SectionHeader title="Contact Details"></SectionHeader>
                        </Box>
                     </Fade>

                     <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                           <Box>
                              <FieldContainer
                                 label="Phone Number"
                                 name="phone_number"
                                 value={controller.formData.phone_number}
                                 onChange={controller.handleChange('phone_number')}
                                 error={!!controller.errors.phone_number}
                                 helperText={controller.errors.phone_number}
                                 placeholder="60 1X-XXX XXXX"
                              ></FieldContainer>

                              <br />
                              <FieldContainer
                                 label="Email Address"
                                 name="email"
                                 type="email"
                                 value={controller.formData.email}
                                 onChange={controller.handleChange('email')}
                                 error={!!controller.errors.email}
                                 helperText={controller.errors.email}
                                 placeholder="user@example.com"
                              ></FieldContainer>
                           </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                           <FieldContainer
                              label="Home Address"
                              name="address"
                              value={controller.formData.address}
                              onChange={controller.handleChange('address')}
                              error={!!controller.errors.address}
                              helperText={controller.errors.address}
                              multiline
                              minRows={3}
                              maxRows={10}
                              placeholder="Enter complete home address"
                           ></FieldContainer>
                        </Grid>
                     </Grid>
                  </Grid>

                  {/* Password */}
                  {/* <Grid size={{ xs: 12, md: 6 }}>
                     <Box>
                        <SectionHeader title="Security"></SectionHeader>

                        <FieldContainer
                           type="password"
                           label="Password"
                           name="password"
                           value={controller.formData.password}
                           onChange={controller.handleChange('password')}
                           error={!!controller.errors.password}
                           helperText={controller.errors.password}
                           placeholder="Enter user's password"
                           notRequired={true}
                        ></FieldContainer>
                     </Box>
                  </Grid> */}

                  {/* Action Buttons */}
                  <Grid size={{ xs: 12, md: 12 }}>
                     <SubmitButton text1="Update User" text2="Updating..." controller={controller}></SubmitButton>
                  </Grid>
               </Grid>
            </Box>
         </DetailCard>

         {/* Success Dialog */}
         <SuccessDialog controller={controller} msg="User updated successfully! Redirecting to user view page..."></SuccessDialog>
      </>
   );
}
